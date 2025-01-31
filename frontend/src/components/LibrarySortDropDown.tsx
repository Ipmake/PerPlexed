import { MenuItem, Select } from "@mui/material";
import React, { SetStateAction, useEffect } from "react";

export type LibrarySort =
  | "title:asc"
  | "title:desc"
  | "added:asc"
  | "added:desc"
  | "year:asc"
  | "year:desc"
  | "updated:asc"
  | "updated:desc";

function LibrarySortDropDown({
  sortHook,
}: {
  sortHook: [string, React.Dispatch<SetStateAction<LibrarySort>>];
}) {
  const [option, setOption] = sortHook;

  useEffect(() => {
    localStorage.setItem("sortBy", option);
  }, [option]);

  return (
    <Select
      value={option}
      onChange={(e) => setOption(e.target.value as LibrarySort)}
    >
      <MenuItem value={"title:asc"}>Title (A-Z)</MenuItem>
      <MenuItem value={"title:desc"}>Title (Z-A)</MenuItem>
      <MenuItem value={"added:asc"}>Date Added (Oldest)</MenuItem>
      <MenuItem value={"added:desc"}>Date Added (Newest)</MenuItem>
      <MenuItem value={"year:asc"}>Year (Oldest)</MenuItem>
      <MenuItem value={"year:desc"}>Year (Newest)</MenuItem>
      <MenuItem value={"updated:asc"}>Date Updated (Oldest)</MenuItem>
      <MenuItem value={"updated:desc"}>Date Updated (Newest)</MenuItem>
    </Select>
  );
}

export function sortMetadata(items: Plex.Metadata[], sort: LibrarySort) {
  switch (sort) {
    case "title:asc":
      return items.sort((a, b) => a.title.localeCompare(b.title));
    case "title:desc":
      return items.sort((a, b) => b.title.localeCompare(a.title));
    case "added:asc":
      return items.sort((a, b) =>
        a.addedAt.toString().localeCompare(b.addedAt.toString())
      );
    case "added:desc":
      return items.sort((a, b) =>
        b.addedAt.toString().localeCompare(a.addedAt.toString())
      );
    case "year:asc":
      return items.sort((a, b) => a.year - b.year);
    case "year:desc":
      return items.sort((a, b) => b.year - a.year);
    case "updated:asc":
      return items.sort((a, b) =>
        a.updatedAt.toString().localeCompare(b.updatedAt.toString())
      );
    case "updated:desc":
      return items.sort((a, b) =>
        b.updatedAt.toString().localeCompare(a.updatedAt.toString())
      );
  }
}

export default LibrarySortDropDown;
