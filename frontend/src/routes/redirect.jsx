import { Link } from "react-router-dom";

export default function Redirect() {
  return (
    <div>
      <div>redirect</div>
      <Link to="/">go home</Link>
    </div>
  );
}
