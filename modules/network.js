import si from "systeminformation";

export async function getNetwork() {
  const net = await si.networkStats();
  if (net.length === 0) return null;
  return {
    rxMB: (net[0].rx_sec / 1024 / 1024).toFixed(2),
    txMB: (net[0].tx_sec / 1024 / 1024).toFixed(2),
    iface: net[0].iface
  };
}