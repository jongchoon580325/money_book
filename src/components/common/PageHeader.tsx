'use client';

interface PageHeaderProps {
  title: string;
  description?: string;
}

export const PageHeader = ({ title, description }: PageHeaderProps) => {
  return (
    <div className="mb-8 text-center">
      <h1 className="text-3xl font-bold text-[#ebf0ec] mb-3">
        {title}
      </h1>
      {description && (
        <p className="text-lg text-[#c3c7c4] mb-6">
          {description}
        </p>
      )}
      <div className="w-full max-w-4xl mx-auto border-b border-dashed border-[#c3c7c4]/30 mt-4"></div>
    </div>
  );
}; 