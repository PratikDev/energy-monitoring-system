/**
 * CeilingLamp
 *
 * A flush-mount ceiling lamp viewed from directly above (top-down POV),
 * rendered in SVG and styled with Tailwind. Turning it on/off is driven
 * by the `on` prop (or override the glow yourself via `glowClassName`).
 *
 * Usage:
 *   <CeilingLamp />                         // off
 *   <CeilingLamp on />                       // on, warm glow
 *   <CeilingLamp on className="w-56 h-56" /> // resize
 *   <CeilingLamp on glowClassName="opacity-100 [filter:blur(2px)]" /> // custom glow override
 */
export default function CeilingLamp({
	className = "size-40",
	glowClassName = "",
	on = false,
	transitionMs = 400,
}) {
	return (
		<div className={className}>
			<svg
				viewBox="0 0 200 200"
				xmlns="http://www.w3.org/2000/svg"
				className="w-full h-full"
			>
				<defs>
					<radialGradient
						id="haloGrad"
						cx="50%"
						cy="50%"
						r="50%"
					>
						<stop
							offset="0%"
							stopColor="#fff3c4"
							stopOpacity="0.9"
						/>
						<stop
							offset="55%"
							stopColor="#ffe9a3"
							stopOpacity="0.35"
						/>
						<stop
							offset="100%"
							stopColor="#ffe9a3"
							stopOpacity="0"
						/>
					</radialGradient>

					<radialGradient
						id="diffuserOnGrad"
						cx="42%"
						cy="38%"
						r="65%"
					>
						<stop
							offset="0%"
							stopColor="#fffaf0"
						/>
						<stop
							offset="45%"
							stopColor="#ffedb8"
						/>
						<stop
							offset="100%"
							stopColor="#f0c869"
						/>
					</radialGradient>

					<radialGradient
						id="diffuserOffGrad"
						cx="42%"
						cy="38%"
						r="65%"
					>
						<stop
							offset="0%"
							stopColor="#e9e6de"
						/>
						<stop
							offset="60%"
							stopColor="#cfccc3"
						/>
						<stop
							offset="100%"
							stopColor="#aba894"
						/>
					</radialGradient>

					<linearGradient
						id="rimGrad"
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
					>
						<stop
							offset="0%"
							stopColor="#b89a63"
						/>
						<stop
							offset="50%"
							stopColor="#8a7047"
						/>
						<stop
							offset="100%"
							stopColor="#5c4a2e"
						/>
					</linearGradient>
				</defs>

				{/* Ambient glow, only visible when on */}
				<circle
					cx="100"
					cy="100"
					r="95"
					fill="url(#haloGrad)"
					className={glowClassName || (on ? "opacity-100" : "opacity-0")}
					style={{ transition: `opacity ${transitionMs}ms ease` }}
				/>

				{/* Metal rim / canopy trim */}
				<circle
					cx="100"
					cy="100"
					r="72"
					fill="url(#rimGrad)"
					stroke="#3d3018"
					strokeWidth="2"
				/>

				{/* Mounting screws */}
				{[0, 120, 240].map((angle) => {
					const rad = (angle * Math.PI) / 180;
					const cx = 100 + 63 * Math.cos(rad);
					const cy = 100 + 63 * Math.sin(rad);
					return (
						<circle
							key={angle}
							cx={cx}
							cy={cy}
							r="3.2"
							fill="#2c2313"
							opacity="0.7"
						/>
					);
				})}

				{/* Glass diffuser, base (off) state */}
				<circle
					cx="100"
					cy="100"
					r="55"
					fill="url(#diffuserOffGrad)"
					stroke="#7a6a4a"
					strokeWidth="1.5"
				/>

				{/* Glass diffuser, "on" overlay that fades in/out */}
				<circle
					cx="100"
					cy="100"
					r="55"
					fill="url(#diffuserOnGrad)"
					stroke="#c9a34a"
					strokeWidth="1.5"
					opacity={on ? 1 : 0}
					style={{ transition: `opacity ${transitionMs}ms ease` }}
				/>

				{/* Center bulb hint */}
				<circle
					cx="100"
					cy="100"
					r="8"
					fill={on ? "#fffdf3" : "#8f8c81"}
					style={{ transition: `fill ${transitionMs}ms ease` }}
				/>
			</svg>
		</div>
	);
}
