import React from "react";

interface ToggleButtonGroupProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (value: string) => void;
  colorClass: string;
}

const ToggleButtonGroup: React.FC<ToggleButtonGroupProps> = ({ 
  label, 
  options, 
  selected, 
  onChange, 
  colorClass 
}) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option} className="flex items-center">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onChange(option)}
              className="hidden"
            />
            <span
              className={`inline-flex items-center justify-center px-3 py-1 text-sm font-medium rounded-md border border-gray-300 cursor-pointer ${
                selected.includes(option)
                  ? `${colorClass} text-white`
                  : "bg-gray-100"
              }`}
            >
              {option}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

interface ProductAttributesFormProps {
  occasions: string[];
  style: string[];
  season: string[];
  fitType: string;
  sizingNotes: string;
  onChangeText: (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => void;
  onToggleOccasion: (occasion: string) => void;
  onToggleStyle: (style: string) => void;
  onToggleSeason: (season: string) => void;
}

export default function ProductAttributesForm({
  occasions,
  style,
  season,
  fitType,
  sizingNotes,
  onChangeText,
  onToggleOccasion,
  onToggleStyle,
  onToggleSeason,
}: ProductAttributesFormProps) {
  const occasionOptions = [
    "Casual", "Formal", "Business", "Party",
    "Wedding", "Beach", "Outdoor", "Sportswear",
  ];
  
  const styleOptions = [
    "Classic", "Modern", "Vintage", "Bohemian",
    "Minimalist", "Elegant", "Casual", "Trendy",
  ];
  
  const seasonOptions = [
    "Spring", "Summer", "Fall", "Winter", "All Seasons"
  ];

  return (
    <div className="space-y-6">
      <ToggleButtonGroup
        label="Suitable Occasions"
        options={occasionOptions}
        selected={occasions}
        onChange={onToggleOccasion}
        colorClass="bg-blue-500"
      />

      <ToggleButtonGroup
        label="Style Attributes"
        options={styleOptions}
        selected={style}
        onChange={onToggleStyle}
        colorClass="bg-purple-500"
      />

      <ToggleButtonGroup
        label="Suitable Seasons"
        options={seasonOptions}
        selected={season}
        onChange={onToggleSeason}
        colorClass="bg-green-500"
      />

      <div>
        <label className="block text-sm font-medium mb-2">
          Fit Type
        </label>
        <select
          name="fitType"
          value={fitType}
          onChange={onChangeText}
          className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option value="Slim Fit">Slim Fit</option>
          <option value="Regular Fit">Regular Fit</option>
          <option value="Relaxed Fit">Relaxed Fit</option>
          <option value="Oversized">Oversized</option>
          <option value="Tailored">Tailored</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Sizing Notes
        </label>
        <textarea
          name="sizingNotes"
          value={sizingNotes}
          onChange={onChangeText}
          placeholder="E.g.: This shirt has a slim fit through the chest and shoulders. We recommend sizing up if you prefer a looser fit."
          className="w-full p-3 border rounded-md h-32 focus:ring-2 focus:ring-blue-500"
        ></textarea>
      </div>
    </div>
  );
}
