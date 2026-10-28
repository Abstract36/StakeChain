import { getUser } from "./auth/[...thirdweb]";
import { NextApiRequest, NextApiResponse } from "next";

const Secret = ({ user }) => {
  if (!user) {
    return (
      <div>
        <p>You are not authorized.</p>
      </div>
    );
  }

  return (
    <div>
      <p>This is a secret for {user.address}.</p>
    </div>
  );
};

export async function getServerSideProps(context) {
  const user = await getUser(context.req);

  return {
    props: {
      user,
    },
  };
}

export default Secret;
