// Create a history object to handle push state history.

export type QsLocation = { search: string };

const theLocation =
  typeof window !== 'undefined' ? window.location : { search: '' };

const push = ({ search }: QsLocation) => {
  const url = new URL(theLocation.toString?.() || '');
  url.search = search;
  history.pushState('', '', url.toString());
};

export default {
  location: theLocation,
  push
};
