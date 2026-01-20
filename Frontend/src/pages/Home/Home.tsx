const Home = () => {
  const handleClick = async () => {
    try {
      const response = await fetch("http://localhost:3001/health", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("API Response:", data);
    } catch (error) {
      console.error("Error calling API:", error);
    }
  };

  return (
    <>
      <div className="bg-red-400 h-screen">
        <button
          onClick={handleClick}
          className="bg-blue-500 text-white p-4 rounded-lg"
        >
          API Test
        </button>
      </div>
    </>
  );
};

export default Home;
