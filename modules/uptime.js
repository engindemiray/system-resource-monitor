import si from "systeminformation";

export async function getUptime() {
  const uptime = si.time().uptime;
  return (uptime / 60 / 60).toFixed(1); // hours
}