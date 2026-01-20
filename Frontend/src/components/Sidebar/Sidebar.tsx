import { Clock, Plus } from "lucide-react";

const Sidebar = () => {
  return (
    <div className="flex h-full w-64 flex-col border-r border-gray-400/50">
      <div className="p-4 flex-1">
        <button className="w-full justify-start gap-2 cursor-pointer rounded-xl py-3 bg-[#0384c5] text-white">
          <div className="flex gap-4 px-5">
            <Plus className="h-5 w-5" />
            New Summary
          </div>
        </button>
      </div>
      <div className="w-full py-5 border-t border-gray-400/50 justify-center items-center flex gap-4">
        <Clock className="w-5 h-5" />
        2 conversations
      </div>
    </div>
  );
};

export default Sidebar;
