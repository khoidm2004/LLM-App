import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="space-y-1 text-center">
        <h1 className="text-[200px] font-extrabold text-[#8ac2e0]">404</h1>
        <p className="text-3xl font-semibold text-[#8ac2e0]">
          Oops! Page Not Found
        </p>

        <div className="mx-auto w-2/5 pt-10">
          <button
            className="w-full rounded-3xl bg-[#8ac2e0] py-3 text-white shadow-lg transition-colors hover:bg-white hover:text-[#8ac2e0] hover:ring-1"
            onClick={() => {
              navigate("/");
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
