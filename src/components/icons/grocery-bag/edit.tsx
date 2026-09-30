// tabler:shopping-bag-edit

import { SVGProps } from "react";

export const BagEditIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      {...props}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <path d="M11 21H8.574a3 3 0 0 1-2.965-2.544l-1.255-8.152A2 2 0 0 1 6.331 8H17.67a2 2 0 0 1 1.977 2.304l-.109.707" />
        <path d="M9 11V6a3 3 0 0 1 6 0v5m3.42 4.61a2.1 2.1 0 0 1 2.97 2.97L18 22h-3v-3z" />
      </g>
    </svg>
  );
};