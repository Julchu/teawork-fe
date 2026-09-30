import { Menu } from "@base-ui/react/menu";
import { CaretRightIcon } from "@radix-ui/react-icons";

export const MenuRadioItem = ({
  value,
  name,
}: {
  value: string;
  name: string;
}) => {
  return (
    <Menu.RadioItem
      className={
        "text-md relative flex h-[25px] items-center rounded-md p-4 pr-[5px] pl-[25px] leading-none outline-none data-[highlighted]:bg-blue-500 data-[highlighted]:text-white"
      }
      value={value}
      closeOnClick={false}
    >
      <Menu.RadioItemIndicator className="absolute left-0 inline-flex w-[25px] items-center justify-center">
        <CaretRightIcon />
      </Menu.RadioItemIndicator>
      {name}
    </Menu.RadioItem>
  );
};