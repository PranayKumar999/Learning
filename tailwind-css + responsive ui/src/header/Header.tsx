/* eslint-disable jsx-a11y/anchor-is-valid */
import React from "react";
import { Link } from "react-router-dom";

function Header() {
  const links = ["Services", "Blogs", "About"];
  return (
    <nav className="bg-gray-800 flex justify-between items-center h-20 p-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6 text-white gap-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
        />
      </svg>
      <p className="text-yellow-50 ml-4 font-semibold text-2xl mr-auto">
        Eduhub
      </p>
      <ul className="flex gap-6 list-none text-gray-200 font-semibold">
        {links.map((link) => (
          <Link
            key={link}
            to={`/${link.toLowerCase()}`}
            className="p-2 hover:bg-gray-700 hover:rounded-md active:bg-purple-700 focus:ring focus:rounded-md focus:outline-none focus:ring-green-600"
          >
            {link}
          </Link>
        ))}
      </ul>
    </nav>
  );
}

export default Header;
