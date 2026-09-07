-- Role matrix: docs/company/permissions.md. No public/authenticated mutation grants.
do $$ begin if not exists(select 1 from pg_roles where rolname='loop_app') then create role loop_app nologin nosuperuser nocreatedb nocreaterole noinherit nobypassrls; end if; end $$;
create schema if not exists company;
grant usage on schema company to loop_app, authenticated;
create table company.organizations (
 id uuid primary key, name text not null check(length(name) between 1 and 120),
 creator uuid not null references auth.users(id), created_at timestamptz not null default now(),
 evaluation_ends_at timestamptz not null default now()+interval '14 days',
 billing_state text not null default 'evaluation' check(billing_state in ('unentitled','evaluation','pending','active','past_due','cancelled')),
 grace_ends_at timestamptz, seats integer not null default 10 check(seats between 0 and 10)
);
create table company.sites (id uuid primary key, org_id uuid not null unique references company.organizations, name text not null, unique(org_id,id));
create table company.teams (id uuid primary key, org_id uuid not null unique references company.organizations, site_id uuid not null, name text not null, unique(org_id,id), foreign key(org_id,site_id) references company.sites(org_id,id));
create table company.memberships (
 org_id uuid not null references company.organizations, user_id uuid not null references auth.users,
 display_name text not null, role text not null check(role in ('owner','billing_admin','manager','collaborator','participant','viewer')),
 reviewer boolean not null default false, revoked_at timestamptz,
 primary key(org_id,user_id), check(not reviewer or role in ('owner','manager','collaborator'))
);
create table company.invitations (
 id uuid primary key, org_id uuid not null references company.organizations, email text not null,
 role text not null check(role in ('billing_admin','manager','collaborator','participant','viewer')),
 reviewer boolean not null default false, token_hash text not null unique, invited_by uuid not null,
 expires_at timestamptz not null default now()+interval '7 days', revoked_at timestamptz, accepted_at timestamptz,
 foreign key(org_id,invited_by) references company.memberships,
 check(not reviewer or role in ('manager','collaborator'))
);
create table company.investigations (
 org_id uuid not null references company.organizations, id uuid not null, team_id uuid not null,
 revision integer not null check(revision>0), document jsonb not null,
 created_by uuid not null, deleted_at timestamptz, updated_at timestamptz not null default now(),
 primary key(org_id,id), unique(id), foreign key(org_id,team_id) references company.teams(org_id,id),
 foreign key(org_id,created_by) references company.memberships,
 check(jsonb_typeof(document)='object' and document->'investigation'->>'id' is not null and document->'investigation'->>'id'=id::text)
);
-- One aggregate per investigation is the command/locking boundary. This relational
-- identity index makes every live domain relationship a same-company FK.
create table company.nodes (
 org_id uuid not null, investigation_id uuid not null, id uuid not null, kind text not null,
 primary key(org_id,investigation_id,id), unique(org_id,id),
 foreign key(org_id,investigation_id) references company.investigations(org_id,id),
 check(kind in ('Investigation','Evidence','Cause','Action','Verification','VerificationReview','Lesson','MetricObservation','Attachment','Containment','History','EvidenceLink','Category','Timeline'))
);
create table company.edges (
 org_id uuid not null, investigation_id uuid not null, source_id uuid not null, target_id uuid not null, relation text not null,
 primary key(org_id,investigation_id,source_id,target_id,relation),
 foreign key(org_id,investigation_id,source_id) references company.nodes(org_id,investigation_id,id) deferrable initially deferred,
 foreign key(org_id,investigation_id,target_id) references company.nodes(org_id,investigation_id,id) deferrable initially deferred
);
create table company.attachments (
 org_id uuid not null, investigation_id uuid not null, id uuid not null, evidence_id uuid not null,
 object_key text not null unique, object_version uuid not null, filename text not null,
 media_type text not null check(media_type in ('application/pdf','image/png','image/jpeg','text/plain','text/csv')),
 size integer not null check(size between 1 and 10485760), checksum text,
 state text not null default 'staged' check(state in ('staged','ready','missing','deleted')),
 uploaded_by uuid not null, created_at timestamptz not null default now(), finalized_at timestamptz,
 primary key(org_id,id), foreign key(org_id,investigation_id) references company.investigations(org_id,id),
 foreign key(org_id,investigation_id,evidence_id) references company.nodes(org_id,investigation_id,id),
 foreign key(org_id,uploaded_by) references company.memberships,
 check(state<>'ready' or (checksum ~ '^[a-f0-9]{64}$' and finalized_at is not null))
);
create table company.command_receipts (
 org_id uuid not null references company.organizations, id uuid not null, actor uuid not null,
 request_hash text not null, record_id uuid, revision integer, result jsonb not null, created_at timestamptz not null default now(),
 primary key(org_id,id), foreign key(org_id,actor) references company.memberships
);
create table company.audit_events (
 id uuid primary key, org_id uuid not null references company.organizations, actor uuid,
 command_id uuid not null, command text not null, record_id uuid, server_time timestamptz not null default clock_timestamp(),
 prior_revision integer, new_revision integer, events jsonb not null default '[]', correlation_id uuid not null,
 provenance jsonb not null default '{"transport":"web","version":1}'
);
create table company.outbox (
 id uuid primary key, org_id uuid not null references company.organizations, actor uuid not null,
 command_id uuid not null, record_id uuid, expected_revision integer,
 kind text not null check(kind in ('invitation','object_delete','record_changed')), payload jsonb not null,
 created_at timestamptz not null default now(), completed_at timestamptz, attempts integer not null default 0,
 last_error text, correlation_id uuid not null, version integer not null default 1,
 unique(org_id,command_id,kind,record_id)
);
create table company.deletion_ledger (
 org_id uuid not null references company.organizations, record_id uuid not null, deleted_at timestamptz not null default now(),
 primary key(org_id,record_id)
);
create table company.billing (
 org_id uuid primary key references company.organizations, customer_id text unique, subscription_id text unique,
 checkout_id text, updated_at timestamptz not null default now(), generation integer not null default 0
);
create table company.billing_events (id text primary key, org_id uuid not null references company.organizations, processed_at timestamptz not null default now(), event_type text not null);

create function company.actor() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
create function company.member_role(o uuid) returns text language sql stable security definer set search_path='' as $$
 select role from company.memberships where org_id=o and user_id=company.actor() and revoked_at is null
$$;
create function company.readable(o uuid) returns boolean language sql stable security definer set search_path='' as $$
 select company.member_role(o) is not null and exists(select 1 from company.organizations where id=o and (
 billing_state='active' or (billing_state in ('evaluation','pending') and now()<evaluation_ends_at+interval '30 days') or now()<grace_ends_at))
$$;
create function company.writable(o uuid) returns boolean language sql stable security definer set search_path='' as $$
 select company.member_role(o) in ('owner','manager','collaborator','participant') and exists(select 1 from company.organizations where id=o and (billing_state='active' or (billing_state in ('evaluation','pending') and now()<evaluation_ends_at)))
$$;
create function company.admin(o uuid) returns boolean language sql stable as $$ select company.member_role(o) in ('owner','manager') $$;
create function company.bootstrap(o uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from company.organizations where id=o and creator=company.actor()) and not exists(select 1 from company.memberships where org_id=o)
$$;
create function company.append_only() returns trigger language plpgsql as $$ begin raise exception 'Append-only application history'; end $$;
create trigger audit_immutable before update or delete on company.audit_events for each row execute function company.append_only();
create trigger deletion_immutable before update or delete on company.deletion_ledger for each row execute function company.append_only();

alter table company.organizations enable row level security;
create policy org_read on company.organizations for select using(company.member_role(id) is not null or creator=company.actor());
create policy org_create on company.organizations for insert to loop_app with check(creator=company.actor());
create policy org_update on company.organizations for update to loop_app using(company.member_role(id) in ('owner','billing_admin')) with check(company.member_role(id) in ('owner','billing_admin'));
alter table company.memberships enable row level security;
create policy membership_read on company.memberships for select using(company.member_role(org_id) is not null);
create policy membership_create on company.memberships for insert to loop_app with check(company.admin(org_id) or (company.bootstrap(org_id) and user_id=company.actor() and role='owner'));
create policy membership_update on company.memberships for update to loop_app using(company.admin(org_id)) with check(company.admin(org_id));
-- Invitation acceptance runs through a narrowly-scoped definer function, using an
-- email fetched from Auth, a hashed bearer token, expiry and organization lock.
create function company.accept_invitation(token text, verified_email text, label text) returns uuid language plpgsql security definer set search_path='' as $$
 declare i company.invitations; o company.organizations; existing company.memberships; seats_used int;
 begin
 select * into i from company.invitations where token_hash=token;
 if i.id is null then raise exception 'Invitation unavailable'; end if;
 perform pg_advisory_xact_lock(hashtextextended(i.org_id::text,1));
 select * into o from company.organizations where id=i.org_id for update;
 select * into i from company.invitations where id=i.id for update;
 if i.revoked_at is not null or i.expires_at<=now() or lower(i.email)<>lower(verified_email) or company.actor() is null then raise exception 'Invitation unavailable'; end if;
 if not exists(select 1 from company.memberships where org_id=i.org_id and user_id=i.invited_by and revoked_at is null and role in ('owner','manager')) then raise exception 'Inviter no longer authorized'; end if;
 if not (o.billing_state='active' or (o.billing_state in ('evaluation','pending') and now()<o.evaluation_ends_at)) then raise exception 'Workspace read-only'; end if;
 if i.accepted_at is not null then
 if exists(select 1 from company.memberships where org_id=i.org_id and user_id=company.actor() and revoked_at is null) then return i.org_id; end if;
 raise exception 'Invitation already used'; end if;
 select * into existing from company.memberships where org_id=i.org_id and user_id=company.actor();
 if existing.user_id is not null and existing.revoked_at is null then raise exception 'Already a member'; end if;
 select count(*) into seats_used from company.memberships where org_id=i.org_id and revoked_at is null and role in ('owner','manager','collaborator');
 seats_used:=seats_used+(select count(*) from company.invitations where org_id=i.org_id and id<>i.id and accepted_at is null and revoked_at is null and expires_at>now() and role in ('manager','collaborator'));
 if i.role in ('manager','collaborator') and seats_used>=o.seats then raise exception 'Seat limit reached'; end if;
 insert into company.memberships(org_id,user_id,display_name,role,reviewer) values(i.org_id,company.actor(),label,i.role,i.reviewer)
 on conflict(org_id,user_id) do update set display_name=excluded.display_name,role=excluded.role,reviewer=excluded.reviewer,revoked_at=null;
 update company.invitations set accepted_at=now() where id=i.id;
 insert into company.audit_events(id,org_id,actor,command_id,command,correlation_id) values(gen_random_uuid(),i.org_id,company.actor(),i.id,'accept_invitation',i.id);
 return i.org_id;
 end $$;

-- All direct browser mutations are absent; the server role remains subject to RLS.
do $$ declare t text; begin
 foreach t in array array['sites','teams','invitations','investigations','nodes','edges','attachments','command_receipts','audit_events','outbox','deletion_ledger','billing','billing_events'] loop
 execute format('alter table company.%I enable row level security',t);
 execute format('create policy tenant_read on company.%I for select using(company.readable(org_id))',t);
 end loop;
 foreach t in array array['sites','teams'] loop
 execute format('create policy initial_insert on company.%I for insert to loop_app with check(company.member_role(org_id)=''owner'')',t);
 end loop;
 foreach t in array array['invitations'] loop
 execute format('create policy manager_write on company.%I for all to loop_app using(company.admin(org_id)) with check(company.admin(org_id))',t);
 end loop;
 foreach t in array array['investigations','nodes','edges','attachments'] loop
 execute format('create policy member_insert on company.%I for insert to loop_app with check(company.writable(org_id))',t);
 execute format('create policy member_update on company.%I for update to loop_app using(company.writable(org_id)) with check(company.writable(org_id))',t);
 end loop;
 foreach t in array array['nodes','edges'] loop
 execute format('create policy index_delete on company.%I for delete to loop_app using(company.writable(org_id))',t);
 end loop;
 foreach t in array array['command_receipts','audit_events','outbox'] loop
 execute format('create policy receipt_insert on company.%I for insert to loop_app with check(company.member_role(org_id) is not null)',t);
 end loop;
 foreach t in array array['billing','billing_events'] loop
 execute format('create policy billing_write on company.%I for all to loop_app using(company.member_role(org_id) in (''owner'',''billing_admin'')) with check(company.member_role(org_id) in (''owner'',''billing_admin''))',t);
 end loop;
 end $$;
create policy outbox_update on company.outbox for update to loop_app using(company.member_role(org_id) is not null) with check(company.member_role(org_id) is not null);
create policy ledger_insert on company.deletion_ledger for insert to loop_app with check(company.admin(org_id));
-- Sensitive administrative tables are never granted to browser roles.
grant select on company.organizations,company.sites,company.teams,company.memberships,company.investigations,company.nodes,company.edges,company.attachments,company.audit_events to authenticated;
grant select,insert,update on all tables in schema company to loop_app;
grant delete on company.nodes,company.edges to loop_app;
revoke update on company.audit_events,company.deletion_ledger,company.command_receipts,company.billing_events from loop_app;
revoke all on all functions in schema company from public;
grant execute on function company.actor(),company.member_role(uuid),company.readable(uuid),company.writable(uuid),company.admin(uuid),company.bootstrap(uuid) to loop_app,authenticated;
grant execute on function company.accept_invitation(text,text,text) to loop_app;
-- Storage remains private. Clients cannot INSERT/UPDATE/DELETE objects; bytes pass
-- through authorized server staging/finalization. No object is overwritten.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('company-evidence','company-evidence',false,10485760,array['application/pdf','image/png','image/jpeg','text/plain','text/csv']) on conflict(id) do nothing;
create policy company_file_read on storage.objects for select to authenticated using(
 bucket_id='company-evidence' and exists(select 1 from company.attachments a join company.investigations i on i.org_id=a.org_id and i.id=a.investigation_id where a.object_key=name and a.state='ready' and i.deleted_at is null and company.readable(a.org_id))
);
create policy hide_deleted on company.investigations as restrictive for select to authenticated using(deleted_at is null);
