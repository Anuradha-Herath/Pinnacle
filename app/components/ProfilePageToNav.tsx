import Link from "next/link";
import React from "react";

const ProfilePageToNav = () => {
  return (
    <div>
      <div className="flex space-x-10 text-center mb-4">
        <Link href="/topaypage">
          <div>
            <div className="text-3xl">💳</div>
            <p>To Pay</p>
          </div>
        </Link>
        <Link href="/toreceivepage">
          <div>
            <div className="text-3xl">🚚</div>
            <p>To Receive</p>
          </div>
        </Link>
        <Link href="/toreviewpage">
          <div>
            <div className="text-3xl">✍️</div>
            <p>To Review</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default ProfilePageToNav;
