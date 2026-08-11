type InsightSectionsProps = {
  strengths: string[];
  gaps: string[];
  recommendations: string[];
};

function InsightList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-zinc-300 p-4 dark:border-zinc-700">
      <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{title}</h2>
      <ul className="mt-2 flex flex-col gap-1">
        {items.map((item) => (
          <li key={item} className="text-sm text-zinc-600 dark:text-zinc-400">
            • {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function InsightSections({ strengths, gaps, recommendations }: InsightSectionsProps) {
  return (
    <div className="flex flex-col gap-3">
      <InsightList title="จุดแข็ง" items={strengths} />
      <InsightList title="จุดที่ควรพัฒนา" items={gaps} />
      <InsightList title="คำแนะนำถัดไป" items={recommendations} />
    </div>
  );
}
