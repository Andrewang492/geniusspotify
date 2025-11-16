import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div>
      <div>page not found</div>
      <Link to="/">go home</Link>
    </div>
  );
}
