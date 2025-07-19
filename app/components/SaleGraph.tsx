"use client";

import React, { useState, useEffect } from "react";
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
import { format } from "date-fns";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface SalesDataPoint {
  month: string;
  sales: number;
  orderCount: number;
}

interface SaleGraphProps {
  salesData: SalesDataPoint[];
}

interface ChartDataset {
  label: string;
  data: number[];
  fill: boolean;
  borderColor: string;
  backgroundColor: string;
  tension: number;
}

interface ChartDataType {
  labels: string[];
  datasets: ChartDataset[];
}

const SaleGraph: React.FC<SaleGraphProps> = ({ salesData }) => {
  const [timePeriod, setTimePeriod] = useState("monthly"); // Default to monthly
  const [chartData, setChartData] = useState<ChartDataType>({
    labels: [],
    datasets: [{
      label: 'Order Count',
      data: [],
      fill: false,
      borderColor: "rgb(255, 127, 80)", // Orange color
      backgroundColor: "rgba(255, 127, 80, 0.1)",
      tension: 0.4,
    }]
  });

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (salesData && salesData.length > 0) {
      // For monthly view, use all 12 months
      if (timePeriod === "monthly") {
        setChartData({
          labels: salesData.map((item: SalesDataPoint) => item.month),
          datasets: [{
            label: 'Monthly Orders',
            data: salesData.map((item: SalesDataPoint) => item.orderCount),
            fill: false,
            borderColor: "rgb(255, 127, 80)", // Orange color
            backgroundColor: "rgba(255, 127, 80, 0.1)",
            tension: 0.4,
          }]
        });
      } 
      // For yearly view, aggregate data by quarters
      else if (timePeriod === "yearly") {
        // Quarterly breakdown
        const quarters = [
          { name: 'Q1', months: salesData.slice(0, 3) },
          { name: 'Q2', months: salesData.slice(3, 6) },
          { name: 'Q3', months: salesData.slice(6, 9) },
          { name: 'Q4', months: salesData.slice(9, 12) }
        ];
        
        const quarterlyData = quarters.map(quarter => {
          return {
            name: quarter.name,
            orderCount: quarter.months.reduce((sum: number, month: SalesDataPoint) => sum + month.orderCount, 0)
          };
        });
        
        setChartData({
          labels: quarterlyData.map(q => q.name),
          datasets: [{
            label: 'Quarterly Orders',
            data: quarterlyData.map(q => q.orderCount),
            fill: false,
            borderColor: "rgb(255, 127, 80)",
            backgroundColor: "rgba(255, 127, 80, 0.1)",
            tension: 0.4,
          }]
        });
      }
    }
  }, [salesData, timePeriod]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 5,
          padding: 10,
          font: {
            size: 11
          },
          callback: function (value: number | string) {
            return value; // Just return the number of orders
          },
        },
        title: {
          display: true,
          text: 'Number of Orders',
          font: {
            size: 12
          },
          padding: {
            top: 0,
            bottom: 10
          }
        },
        grid: {
          color: 'rgba(200, 200, 200, 0.2)'
        }
      },
      x: {
        ticks: {
          font: {
            size: 11
          },
          padding: 5
        },
        grid: {
          color: 'rgba(200, 200, 200, 0.2)'
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          title: function(tooltipItems: any[]) {
            return tooltipItems[0].label;
          },
          label: function(context: any) {
            return `Orders: ${context.parsed.y}`;
          }
        }
      },
      title: {
        display: true,
        text: `${currentYear} Order Statistics`,
        color: '#333',
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
    },
  };

  const handleTimePeriodChange = (period: string) => {
    setTimePeriod(period);
  };

  return (
    <div className="bg-white p-4 rounded shadow h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-4">Order Statistics</h3>
      <div className="flex-grow" style={{ minHeight: "300px" }}>
        <Line data={chartData} options={options} />
      </div>
      <div className="mt-auto">
        <div className="flex justify-center mt-4 space-x-4">
          <button
            className={`text-sm px-5 py-1.5 rounded ${
              timePeriod === "monthly" ? "bg-orange-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => handleTimePeriodChange("monthly")}
          >
            MONTHLY
          </button>
          <button
            className={`text-sm px-5 py-1.5 rounded ${
              timePeriod === "yearly" ? "bg-orange-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => handleTimePeriodChange("yearly")}
          >
            YEARLY
          </button>
        </div>
        <p className="text-xs text-center text-gray-500 mt-2">
          Showing {timePeriod} order counts for {currentYear}
        </p>
      </div>
    </div>
  );
};

export default SaleGraph;
