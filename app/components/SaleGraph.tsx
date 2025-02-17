"use client";

import React, { useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const SaleGraph: React.FC = () => {
  const [timePeriod, setTimePeriod] = useState("monthly"); // Default to monthly

  const data = {
    labels: ["JUL", "AUG", "SEP", "OCT", "NOV", "DEC"],
    datasets: [
      {
        label: "Sales",
        data: [40, 42, 45, 70, 50, 380], // Example data, replace with your actual data
        fill: false,
        borderColor: "rgb(255, 127, 80)", // Orange color
        tension: 0.4,
      },
    ],
  };

  const options = {
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 100,
          callback: function (value: number | string) {
            return "$" + value;
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false, // Hide legend
      },
      title: {
        display: false, // Hide title
      },
    },
  };

  const handleTimePeriodChange = (period: string) => {
    setTimePeriod(period);
    // You'd typically update the data based on the selected period here
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="text-lg font-semibold mb-4">Sale Graph</h3>
      <div className="h-64">
        <Line data={data} options={options} />
      </div>
      <div className="flex justify-center mt-4 space-x-2">
        <button
          className={`text-sm px-3 py-1 rounded ${
            timePeriod === "weekly" ? "bg-gray-200" : ""
          }`}
          onClick={() => handleTimePeriodChange("weekly")}
        >
          WEEKLY
        </button>
        <button
          className={`text-sm px-3 py-1 rounded ${
            timePeriod === "monthly" ? "bg-orange-500 text-white" : ""
          }`}
          onClick={() => handleTimePeriodChange("monthly")}
        >
          MONTHLY
        </button>
        <button
          className={`text-sm px-3 py-1 rounded ${
            timePeriod === "yearly" ? "bg-gray-200" : ""
          }`}
          onClick={() => handleTimePeriodChange("yearly")}
        >
          YEARLY
        </button>
      </div>
    </div>
  );
};

export default SaleGraph;
