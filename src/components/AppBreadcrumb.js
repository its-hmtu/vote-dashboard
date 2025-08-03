import { useLocation, useNavigate } from "react-router-dom";
import { getPathUrl } from "../utils";
import classNames from "classnames";
import { Breadcrumb } from "antd";

const nonClickableSegmentNames = ["create", "update", "edit", "detail"];

const formatSegment = (segment) =>
  segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const AppBreadcrumb = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const pathUrl = getPathUrl(pathname);

  const onNavigate = (e, href, isClickable) => {
    e.preventDefault();
    if (!isClickable) return;

    navigate(href);
  };

  const buildItem = (key, name, href, isLast, isDynamic) => {
    const label = isDynamic ? "Detail" : formatSegment(name);
    const isClickable =
      !isLast &&
      !isDynamic &&
      !nonClickableSegmentNames.includes(name.toLowerCase());

    return {
      key,
      title: <span className="flex items-center gap-1">{label}</span>,
      href,
      className: classNames(
        isClickable
          ? "cursor-pointer"
          : "pointer-events-none",
        isLast && "!text-black"
      ),
      onClick: (e) => onNavigate(e, href, isClickable),
    };
  };

  const breadcrumbItems = [
    ...pathUrl.map((item, index) =>
      buildItem(
        index,
        item.name,
        item.url,
        index === pathUrl.length - 1,
        item.isDynamicSegment
      )
    ),
  ];

  return (
    <Breadcrumb
      className="app-breadcrumb flex items-center"
      items={breadcrumbItems}
    />
  );
};

export default AppBreadcrumb;
