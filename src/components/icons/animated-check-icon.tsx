// hugeicons:checkmark-square-03
import { SVGProps } from "react";

export const AnimatedCheckIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
      className={`cursor-pointer ${props.className}`}
    >
      <g
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        color="currentColor"
      >
        <path d="M21.448 8.2c.052 1.05.052 2.3.052 3.8c0 4.478 0 6.718-1.391 8.109S16.479 21.5 12 21.5c-4.478 0-6.718 0-8.109-1.391S2.5 16.479 2.5 12c0-4.478 0-6.718 1.391-8.109S7.521 2.5 12 2.5c1.072 0 2.016 0 2.85.02" />
        <path
          strokeDasharray="32"
          strokeDashoffset="32"
          d="M8 11.5s1.5 0 3.5 3.5c0 0 5.059-9.167 10-11"
        >
          <animate
            fill="freeze"
            attributeName="stroke-dashoffset"
            begin="0.1s"
            dur="0.5s"
            values="32;0"
          />
        </path>
      </g>
    </svg>
  );
};

export const EmptyCheckbox = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
      className={`cursor-pointer ${props.className}`}
    >
      <path
        fill="none"
        strokeWidth="1.5"
        d="M2.5 12c0-4.478 0-6.718 1.391-8.109S7.521 2.5 12 2.5c4.478 0 6.718 0 8.109 1.391S21.5 7.521 21.5 12c0 4.478 0 6.718-1.391 8.109S16.479 21.5 12 21.5c-4.478 0-6.718 0-8.109-1.391S2.5 16.479 2.5 12Z"
      />
    </svg>
  );
};