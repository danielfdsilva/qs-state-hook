// Create a history object to handle push state history.
const theLocation =
  typeof window !== 'undefined' ? window.location : { search: '' };

const push = ({ search }) => {
  const url = new URL(theLocation);
  url.search = search;
  history.pushState('', '', url.toString());
};

export default {
  location: theLocation,
  push
};
