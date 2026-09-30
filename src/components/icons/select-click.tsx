// tabler: click;
import { SVGProps } from "react";

export const SelectClick = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M3 12h3m6-9v3M7.8 7.8L5.6 5.6m10.6 2.2l2.2-2.2M7.8 16.2l-2.2 2.2M12 12l9 3l-4 2l-2 4z"
      />
    </svg>
  );
};