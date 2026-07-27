export function FooterSection() {
  return (
    <footer className="border-t border-slate-700 py-8">
      <div className="mx-auto max-w-6xl px-4 text-center md:px-6 lg:px-8">
        <p className="font-body text-sm text-slate-300">
          © {new Date().getFullYear()} AI_Project. สงวนลิขสิทธิ์.
        </p>
      </div>
    </footer>
  );
}
