const Divider = () => (
  <div
    className="px-4 py-6 lg:py-10"
    style={{ backgroundColor: "#FAFAF8" }}
    aria-hidden
  >
    <div className="mx-auto max-w-3xl flex items-center gap-4">
      <span
        className="flex-1"
        style={{ height: 1, backgroundColor: "rgba(26,26,26,0.10)" }}
      />
      <span
        className="block rounded-full"
        style={{ width: 4, height: 4, backgroundColor: "rgba(26,26,26,0.25)" }}
      />
      <span
        className="flex-1"
        style={{ height: 1, backgroundColor: "rgba(26,26,26,0.10)" }}
      />
    </div>
  </div>
);

export default Divider;
