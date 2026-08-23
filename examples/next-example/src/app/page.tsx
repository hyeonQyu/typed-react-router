import { redirect } from 'next/navigation';
import { routes } from '../routes';

export default function IndexPage() {
  // `buildHref` works on the server too — it is plain data, no hooks involved.
  redirect(routes.buildHref('/home'));
}
