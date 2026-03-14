import si from "systeminformation";

export async function getDisk() {
  const disks = await si.fsSize();
  return disks.map(d => ({
    mount: d.mount,
    size: (d.size / 1024 / 1024 / 1024).toFixed(2), // GB
    used: (d.used / 1024 / 1024 / 1024).toFixed(2), // GB
    usePercent: Number(d.use || 0)
  }));
}