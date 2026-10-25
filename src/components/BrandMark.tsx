import { Link } from 'react-router-dom';

// Header brand slot: the site logo, linking home
const BrandMark = () => (
  <Link to="/" className="flex items-center h-11 shrink-0" aria-label="Speed Champion home">
    <img src="/brand/site-logo.webp" alt="Speed Champion" className="h-8 md:h-9 w-auto" draggable={false} />
  </Link>
);

export default BrandMark;
