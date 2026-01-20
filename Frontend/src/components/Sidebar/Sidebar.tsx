const Sidebar = () => {
  return (
    <div className="flex h-full w-64 flex-col border-r border-border">
      <div className="p-4">
        <button className="w-full justify-start gap-2 cursor-pointer rounded-xl py-3 bg-[#0384c5] text-white">
          New Summary
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
