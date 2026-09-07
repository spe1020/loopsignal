create table company.billing_operations (
 org_id uuid not null references company.organizations(id),
 id uuid not null,
 actor uuid not null,
 kind text not null check(kind in ('checkout','portal')),
 created_at timestamptz not null default now(),
 result jsonb,
 primary key(org_id,id),
 foreign key(org_id,actor) references company.memberships(org_id,user_id)
);
alter table company.billing_operations enable row level security;
create policy billing_operation_access on company.billing_operations for all to loop_app using(company.member_role(org_id) in ('owner','billing_admin')) with check(company.member_role(org_id) in ('owner','billing_admin'));
grant select,insert,update on company.billing_operations to loop_app;
-- This narrowly scoped lookup is for a signature-verified Stripe event. It exposes
-- only the existing mapping; no client can call it or nominate an organization.
create function company.billing_owner(customer text) returns table(org_id uuid,owner_id uuid) language sql stable security definer set search_path='' as $$
 select b.org_id,o.creator from company.billing b join company.organizations o on o.id=b.org_id where b.customer_id=customer
$$;
revoke all on function company.billing_owner(text) from public;
grant execute on function company.billing_owner(text) to loop_app;
-- Immutable object identity and checksums survive logical missing/deleted states.
create function company.immutable_file() returns trigger language plpgsql as $$
begin
 if old.object_key<>new.object_key or old.object_version<>new.object_version or old.evidence_id<>new.evidence_id or old.investigation_id<>new.investigation_id or old.org_id<>new.org_id or (old.checksum is not null and old.checksum is distinct from new.checksum) then raise exception 'Evidence objects are immutable; stage a new object'; end if;
 return new;
end $$;
create trigger file_immutable before update on company.attachments for each row execute function company.immutable_file();
revoke all on function company.immutable_file() from public;
-- Audit, receipts and asynchronous relationships cannot mix companies either.
alter table company.audit_events add constraint audit_record_company_fk foreign key(org_id,record_id) references company.investigations(org_id,id);
alter table company.audit_events add constraint audit_actor_company_fk foreign key(org_id,actor) references company.memberships(org_id,user_id);
alter table company.outbox add constraint outbox_record_company_fk foreign key(org_id,record_id) references company.investigations(org_id,id);
alter table company.outbox add constraint outbox_actor_company_fk foreign key(org_id,actor) references company.memberships(org_id,user_id);
alter table company.command_receipts add constraint receipt_record_company_fk foreign key(org_id,record_id) references company.investigations(org_id,id);
alter table company.attachments add constraint attachment_node_company_fk foreign key(org_id,investigation_id,id) references company.nodes(org_id,investigation_id,id) deferrable initially deferred;
