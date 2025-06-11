import React from 'react';

interface CardProps {
  title: string;
  count: number;
  status: string | null;
  activeFilter: string | null;
  onClick: (status: string | null) => void;
  bgColor: string;
  textColor: string;
  icon: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  title,
  count,
  status,
  activeFilter,
  onClick,
  bgColor,
  textColor,
  icon,
}) => {
  return (
    <div
      onClick={() => onClick(status)}
      className={`bg-white p-4 rounded-lg shadow-md flex items-center gap-4 cursor-pointer ${activeFilter === status ? `ring-2 ring-${textColor}` : ''}`}
    >
      <div className="flex-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-2xl font-bold inline">{count}</p>
        <span className="mx-2"></span>
        <p className="inline">(items)</p>
      </div>
      <div className={`p-3 ${bgColor} rounded-lg ml-auto`}>{icon}</div>
    </div>
  );
};

export default Card;
