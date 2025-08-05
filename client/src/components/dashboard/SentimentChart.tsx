import { useState } from "react";

interface ChartDataPoint {
  day: string;
  positive: number;
  neutral: number;
  negative: number;
}

// Sample data for the chart
const weeklyData: ChartDataPoint[] = [
  { day: "Mon", positive: 30, neutral: 15, negative: 10 },
  { day: "Tue", positive: 40, neutral: 20, negative: 5 },
  { day: "Wed", positive: 35, neutral: 15, negative: 15 },
  { day: "Thu", positive: 50, neutral: 10, negative: 10 },
  { day: "Fri", positive: 42, neutral: 18, negative: 12 },
  { day: "Sat", positive: 25, neutral: 10, negative: 8 },
  { day: "Sun", positive: 15, neutral: 8, negative: 5 }
];

const monthlyData: ChartDataPoint[] = [
  { day: "Week 1", positive: 120, neutral: 60, negative: 40 },
  { day: "Week 2", positive: 150, neutral: 70, negative: 30 },
  { day: "Week 3", positive: 135, neutral: 55, negative: 45 },
  { day: "Week 4", positive: 180, neutral: 40, negative: 30 }
];

const quarterlyData: ChartDataPoint[] = [
  { day: "Jan", positive: 350, neutral: 180, negative: 120 },
  { day: "Feb", positive: 380, neutral: 150, negative: 90 },
  { day: "Mar", positive: 420, neutral: 170, negative: 100 }
];

type TimeRange = "Week" | "Month" | "Quarter";

export default function SentimentChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>("Week");

  const getChartData = () => {
    switch (timeRange) {
      case "Week":
        return weeklyData;
      case "Month":
        return monthlyData;
      case "Quarter":
        return quarterlyData;
      default:
        return weeklyData;
    }
  };

  const data = getChartData();
  
  // Calculate the maximum value for scaling
  const maxValue = Math.max(
    ...data.map(d => Math.max(d.positive, d.neutral, d.negative))
  );
  
  // Scale each value based on the maximum (50 is the maximum height percentage)
  const scaleValue = (value: number) => Math.round((value / maxValue) * 50);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm lg:col-span-2">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Sentiment Trend</h2>
        <div className="flex space-x-2">
          <button 
            className={`text-xs ${timeRange === "Week" ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-gray-100"} px-3 py-1 rounded-full`}
            onClick={() => setTimeRange("Week")}
          >
            Week
          </button>
          <button 
            className={`text-xs ${timeRange === "Month" ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-gray-100"} px-3 py-1 rounded-full`}
            onClick={() => setTimeRange("Month")}
          >
            Month
          </button>
          <button 
            className={`text-xs ${timeRange === "Quarter" ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-gray-100"} px-3 py-1 rounded-full`}
            onClick={() => setTimeRange("Quarter")}
          >
            Quarter
          </button>
        </div>
      </div>
      
      {/* Chart */}
      <div className="h-64 flex items-end space-x-1 mt-4 pb-4 px-2 border-b border-l border-gray-200 relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 inset-y-0 flex flex-col justify-between text-xs text-gray-500 -ml-7">
          <span>{maxValue}</span>
          <span>{Math.round(maxValue * 0.8)}</span>
          <span>{Math.round(maxValue * 0.6)}</span>
          <span>{Math.round(maxValue * 0.4)}</span>
          <span>{Math.round(maxValue * 0.2)}</span>
          <span>0</span>
        </div>
        
        {/* X-axis labels */}
        <div className="absolute bottom-0 inset-x-0 flex justify-between text-xs text-gray-500 translate-y-4 px-4">
          {data.map((d, index) => (
            <span key={index}>{d.day}</span>
          ))}
        </div>
        
        {/* Bars for sentiment groups */}
        <div className="flex-1 flex justify-between items-end px-4">
          {data.map((d, index) => (
            <div key={index} className="flex space-x-1">
              <div 
                className="w-3 bg-[#4CAF50] rounded-t" 
                style={{ height: `${scaleValue(d.positive)}%` }}
              ></div>
              <div 
                className="w-3 bg-[#9E9E9E] rounded-t" 
                style={{ height: `${scaleValue(d.neutral)}%` }}
              ></div>
              <div 
                className="w-3 bg-[#F44336] rounded-t" 
                style={{ height: `${scaleValue(d.negative)}%` }}
              ></div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center space-x-4 mt-4 justify-center">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-[#4CAF50] rounded mr-1"></div>
          <span className="text-xs text-gray-600">Positive</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-[#9E9E9E] rounded mr-1"></div>
          <span className="text-xs text-gray-600">Neutral</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-[#F44336] rounded mr-1"></div>
          <span className="text-xs text-gray-600">Negative</span>
        </div>
      </div>
    </div>
  );
}
