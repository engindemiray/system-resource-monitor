import si from "systeminformation";

export async function getRAM() {
  const mem = await si.mem();
  const usedPercent = ((mem.active / mem.total) * 100).toFixed(1);
  return {
    usedPercent,
    total: (mem.total / 1024 / 1024 / 1024).toFixed(2), // GB
    used: (mem.active / 1024 / 1024 / 1024).toFixed(2)    // GB
  };
}