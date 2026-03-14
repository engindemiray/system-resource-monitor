import si from "systeminformation";

export async function getCPU() {
  const cpu = await si.currentLoad();
  return {
    load: cpu.currentLoad.toFixed(1),
    cores: cpu.cpus.map(c => c.load.toFixed(1))
  };
}