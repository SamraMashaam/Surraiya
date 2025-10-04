import { useNavigate } from "react-router-dom";

function HomePage() {
  const navigate = useNavigate();

  const handleStartFocus = () => {
    // Ask for notifications when the user explicitly starts focus mode
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          console.log("Notifications enabled ✅");
        } else {
          console.log("Notifications denied ❌");
        }
      });
    }

    // Navigate to Focus Mode page
    navigate("/focus");
  };

  return (
    <div>
      <h1>Productivity App</h1>
      <button onClick={handleStartFocus}>
        Start Focus Mode
      </button>
    </div>
  );
}

export default HomePage;
