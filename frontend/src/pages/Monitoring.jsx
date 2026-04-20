import SensorChart from "../components/SensorChart";

const Monitoring = () => {
  return (
    <div className="p-6 space-y-6 bg-[#020617] min-h-screen text-white">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">Giám sát hệ thống</h1>
        <p className="text-gray-400 mt-1">
          Theo dõi dữ liệu cảm biến và trạng thái thiết bị theo thời gian thực
        </p>
      </div>

      {/* TOP GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* CHART */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-lg p-5 rounded-2xl border border-white/10 shadow-xl hover:shadow-2xl transition">
          <h2 className="text-lg font-semibold mb-4">📈 Dữ liệu cảm biến</h2>
          <SensorChart />
        </div>
      </div>
      {/* FOOTER */}
      <div className="text-center text-gray-500 text-sm">
        Cập nhật realtime • {new Date().toLocaleString("vi-VN")}
      </div>
    </div>
  );
};

export default Monitoring;
