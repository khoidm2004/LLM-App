import { ScaleLoader } from "react-spinners";

const LoadingPage = () => {
  return (
    <div className="flex h-screen items-center justify-center">
      <ScaleLoader color="#0384c5" width={15} height={100} />
    </div>
  );
};

export default LoadingPage;
