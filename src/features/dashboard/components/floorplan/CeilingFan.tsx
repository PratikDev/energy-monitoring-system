import type { CSSProperties } from "react";

/**
 * CeilingFan
 *
 * A wooden ceiling fan rendered in SVG, styled with Tailwind.
 * Rotation is controlled entirely by className — pass any Tailwind
 * animate-spin variant (or your own arbitrary-value class) and it
 * spins the blades, not the mount.
 *
 * Usage:
 *   <CeilingFan />                                    // static
 *   <CeilingFan spinning />                            // spins, default 1.2s/rotation
 *   <CeilingFan spinning speed={0.6} />                 // faster
 *   <CeilingFan className="w-48 h-48" bladeClassName="animate-[spin_3s_linear_infinite]" />
 */
type CeilingFanProps = {
	className?: string;
	bladeClassName?: string;
	spinning?: boolean;
	speed?: number;
	reverse?: boolean;
};

type FanBladeStyle = CSSProperties & {
	"--fan-speed"?: string;
};

export default function CeilingFan({
	className = "size-40",
	bladeClassName = "",
	spinning = false,
	speed = 1.2, // seconds per rotation, only used when `spinning` is true and no bladeClassName override
	reverse = false,
}: CeilingFanProps) {
	const spinClass = bladeClassName
		? bladeClassName
		: spinning
			? "fan-spin"
			: "";
	const bladeStyle: FanBladeStyle | undefined =
		spinning && !bladeClassName ? { "--fan-speed": `${speed}s` } : undefined;

	return (
		<div className={className}>
			<style>{`
        @keyframes fan-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(${reverse ? "-360deg" : "360deg"}); }
        }
        .fan-spin {
          animation: fan-rotate var(--fan-speed, 1.2s) linear infinite;
          transform-origin: 100px 100px;
        }
      `}</style>
			<svg
				viewBox="0 0 200 200"
				xmlns="http://www.w3.org/2000/svg"
				className="w-full h-full"
			>
				<defs>
					<radialGradient
						id="hubGrad"
						cx="38%"
						cy="32%"
						r="75%"
					>
						<stop
							offset="0%"
							stopColor="#8a5a34"
						/>
						<stop
							offset="55%"
							stopColor="#6b4023"
						/>
						<stop
							offset="100%"
							stopColor="#3f2413"
						/>
					</radialGradient>

					<linearGradient
						id="bladeGrad"
						x1="0%"
						y1="0%"
						x2="100%"
						y2="0%"
					>
						<stop
							offset="0%"
							stopColor="#4a2c17"
						/>
						<stop
							offset="35%"
							stopColor="#7a4c28"
						/>
						<stop
							offset="65%"
							stopColor="#6b4023"
						/>
						<stop
							offset="100%"
							stopColor="#3f2413"
						/>
					</linearGradient>

					<linearGradient
						id="rodGrad"
						x1="0%"
						y1="0%"
						x2="100%"
						y2="0%"
					>
						<stop
							offset="0%"
							stopColor="#2c1a0e"
						/>
						<stop
							offset="50%"
							stopColor="#5a3a22"
						/>
						<stop
							offset="100%"
							stopColor="#2c1a0e"
						/>
					</linearGradient>
				</defs>

				{/* Rotating blade assembly */}
				<g
					style={bladeStyle}
					className={spinClass}
				>
					{[0, 120, 240].map((angle) => (
						<g
							key={angle}
							transform={`rotate(${angle} 100 100)`}
						>
							<rect
								x="91"
								y="22"
								width="18"
								height="72"
								rx="9"
								fill="url(#bladeGrad)"
								stroke="#2c1a0e"
								strokeWidth="1.5"
							/>
							{/* subtle highlight strip on each blade */}
							<rect
								x="94"
								y="26"
								width="4"
								height="60"
								rx="2"
								fill="#9c6c3f"
								opacity="0.35"
							/>
						</g>
					))}

					{/* Center hub */}
					<circle
						cx="100"
						cy="100"
						r="20"
						fill="url(#hubGrad)"
						stroke="#2c1a0e"
						strokeWidth="1.5"
					/>
					<ellipse
						cx="93"
						cy="92"
						rx="6"
						ry="4"
						fill="#c99b6a"
						opacity="0.5"
					/>
				</g>
			</svg>
		</div>
	);
}
