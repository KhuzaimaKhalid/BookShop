import { useState, useEffect } from "react";

const useLiveClock = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const day = now
    .toLocaleDateString("en-US", { weekday: "long" })
    .toUpperCase();

  const date = now.toISOString().split("T")[0];

  return { time, day, date };
};

export default useLiveClock;