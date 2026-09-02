"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/loop/format";
import type { RecentItem, RecentTone } from "@/lib/loop/recent";
import { StatusChip } from "./HeaderParts";
import { IconAlert, IconCheck, IconCircle, IconCopy, IconDot, IconDownload, IconPause, IconShield, IconTrash } from "./icons";
import { Card, IconButton, LoopButton } from "./ui";
import { useMediaQuery } from "./useMediaQuery";

const toneIcon: Record<RecentTone, React.ReactNode> = {
  neutral: <IconCircle size={12} />,
  blue: <IconDot size={12} />,
  amber: <IconPause size={12} />,
  copper: <IconShield size={12} />,
  red: <IconAlert size={12} />,
  green: <IconCheck size={12} />,
  ink: <IconDot size={12} />,
};

export function RecentStatus({ item }: { item: RecentItem }) {
  return <StatusChip label={item.status.label} tone={item.status.tone} icon={toneIcon[item.status.tone]} />;
}

export function Completion({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`${pct} percent complete`}>
      <span className="h-1.5 w-20 overflow-hidden rounded-full bg-paper-2">
        <span className="block h-full rounded-full bg-copper" style={{ width: `${pct}%` }} />
      </span>
      <span className="font-mono text-[12px] text-graphite">{pct}%</span>
    </div>
  );
}

/**
 * Shared "Recent" table (≥768) / card list (<768) for every document in this
 * browser. The Type column says which tool a row belongs to.
 */
export function RecentList({
  items,
  onDuplicate,
  onExport,
  onDelete,
}: {
  items: RecentItem[];
  onDuplicate: (item: RecentItem) => void;
  onExport: (item: RecentItem) => void;
  onDelete: (item: RecentItem) => void;
}) {
  const router = useRouter();
  const wide = useMediaQuery("(min-width: 768px)", true);
  if (wide) {
    return (
      <div className="mt-6 overflow-x-auto rounded-[3px] border border-line bg-cream">
        <table className="w-full text-left text-[14px]">
          <thead className="border-b border-line bg-paper text-[11px] font-medium uppercase tracking-[0.14em] text-stone">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="hidden px-4 py-3 lg:table-cell">Detail</th>
              <th className="hidden px-4 py-3 lg:table-cell">Owner</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3">Completion</th>
              <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={`${item.tool}-${item.id}`} className="border-b border-line last:border-0 hover:bg-paper/70">
                <td className="px-4 py-3 text-[12.5px] text-graphite whitespace-nowrap">{item.toolLabel}</td>
                <td className="px-4 py-3 font-mono text-[12px] tracking-[0.06em] text-copper whitespace-nowrap">
                  <Link href={item.href} className="focus-visible:outline-2 focus-visible:outline-copper">{item.number}</Link>
                </td>
                <td className="max-w-[360px] px-4 py-3">
                  <Link href={item.href} className="block truncate font-medium text-ink hover:text-copper focus-visible:outline-2 focus-visible:outline-copper">
                    {item.title || <span className="font-normal text-stone">{item.untitled}</span>}
                  </Link>
                  {item.subtitle ? <span className="block truncate text-[12.5px] text-stone">{item.subtitle}</span> : null}
                </td>
                <td className="px-4 py-3"><RecentStatus item={item} /></td>
                <td className="hidden px-4 py-3 text-[13px] text-graphite whitespace-nowrap lg:table-cell">{item.detail}</td>
                <td className="hidden px-4 py-3 text-graphite lg:table-cell">{item.owner || "—"}</td>
                <td className="px-4 py-3 text-graphite whitespace-nowrap">{formatDate(item.updatedAt)}</td>
                <td className="px-4 py-3"><Completion pct={item.completion} /></td>
                <td className="px-2 py-2">
                  <div className="flex items-center justify-end gap-0.5">
                    <Link href={item.href} className="inline-flex min-h-[36px] items-center rounded-[3px] px-2.5 text-[13px] font-medium text-ink hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-copper">Open</Link>
                    <IconButton label={`Duplicate ${item.number}`} onClick={() => onDuplicate(item)} className="min-h-[36px] min-w-[36px]"><IconCopy size={15} /></IconButton>
                    <IconButton label={`Export ${item.number}`} onClick={() => onExport(item)} className="min-h-[36px] min-w-[36px]"><IconDownload size={15} /></IconButton>
                    <IconButton label={`Delete ${item.number}`} onClick={() => onDelete(item)} className="min-h-[36px] min-w-[36px] hover:text-risk-critical"><IconTrash size={15} /></IconButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <ul className="mt-6 flex flex-col gap-3">
      {items.map((item) => (
        <Card as="li" key={`${item.tool}-${item.id}`} className="p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[12px] tracking-[0.06em] text-copper">{item.number}</span>
            <span className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.12em] text-stone">{item.toolLabel}</span>
              <RecentStatus item={item} />
            </span>
          </div>
          <Link href={item.href} className="mt-2 block text-[16px] font-medium leading-6 text-ink focus-visible:outline-2 focus-visible:outline-copper">
            {item.title || <span className="font-normal text-stone">{item.untitled}</span>}
          </Link>
          <p className="mt-1 text-[13px] text-stone">
            {item.detail} · Updated {formatDate(item.updatedAt)}
          </p>
          <div className="mt-3"><Completion pct={item.completion} /></div>
          <div className="mt-3 flex flex-wrap gap-1">
            <LoopButton size="sm" variant="dark" onClick={() => router.push(item.href)}>Open</LoopButton>
            <LoopButton size="sm" onClick={() => onDuplicate(item)}>Duplicate</LoopButton>
            <LoopButton size="sm" onClick={() => onExport(item)}>Export</LoopButton>
            <LoopButton size="sm" variant="danger" onClick={() => onDelete(item)}>Delete</LoopButton>
          </div>
        </Card>
      ))}
    </ul>
  );
}
