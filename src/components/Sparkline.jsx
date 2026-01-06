import React from 'react';

export default function Sparkline({ data = [], color = '#10b981', width = 120, height = 40 }) {
	if (data.length < 2) {
		data = [30, 40, 35, 50, 49, 60, 70, 91, 100, 85, 95, 80];
	}

	const max = Math.max(...data);
	const min = Math.min(...data);
	const range = max - min || 1;

	const points = data.map((value, index) => {
		const x = (index / (data.length - 1)) * width;
		const y = height - ((value - min) / range) * height;
		return `${x},${y}`;
	}).join(' ');

	return (
		<svg
			width={width}
			height={height}
			className="absolute bottom-4 right-4 opacity-20"
			preserveAspectRatio="none"
		>
			<polyline
				points={points}
				fill="none"
				stroke={color}
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}
