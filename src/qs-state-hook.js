import { useEffect, useState, useRef, useMemo } from 'react';
import qs from 'qs';
import debounce from 'lodash.debounce';

import history from './mini-history';

/**
 * Compares two values using JSON stringification.
 *
 * @param {mixed} a Data to compare
 * @param {mixed} b Data to compare
 */
export function isEqualObj(a, b) {
  // Exist early if they're the same.
  if (a === b) return true;
  return JSON.stringify(a) === JSON.stringify(b);
}

// Each hook handles a single value, however there are times where multiple
// hooks are called simultaneously triggering several url updates. An example of
// this would be a map state. We'd have a hook for the center point and another
// for the zoom level, however these 2 values should be stored in the url at the
// same time to ensure a proper navigation. When we press the back key we want
// to go back to the previous center and zoom, and not only one at a time. The
// solution for this is to store the properties to be changed and only commit
// the to the url once all the changes were made. This is done using a debounced
// function that triggers 100ms after the last action.
export const COMMIT_DELAY = 100;
let commitQueue = {};

export function useQsStateCreator(options = {}) {
  const {
    commit: commitToLocation = history.push,
    location = history.location
  } = options;

  return useMemo(() => {
    const commit = debounce(() => {
      const parsedQS = qs.parse(location.search, {
        ignoreQueryPrefix: true
      });

      // New object that is going to be stringified to the url.
      // Current properties plus the ones to be changed.
      const qsObject = {
        ...parsedQS,
        ...commitQueue
      };

      commitToLocation({ search: qs.stringify(qsObject, { skipNulls: true }) });
      // Once the commit happens clear the commit queue.
      commitQueue = {};
    }, COMMIT_DELAY);

    function storeInURL(k, v) {
      // Store the new value in the queue.
      commitQueue = {
        ...commitQueue,
        [k]: v
      };
      // Try to commit.
      commit();
    }

    /**
     * Qs State is used to sync a state object with url search string.
     * It will keep the state value in sync with the url.
     * The value will be validated according to the state definition
     *
     * Example:
     * {
     *    key: 'field',
     *    hydrator: (v) => v,
     *    dehydrator: (v) => v,
     *    default: 'all',
     *    validator: [1, 2, 3]
     * }
     *
     * {string} key - Key name to use on the search string
     * {func} hydrator - Any transformation to apply to the value from the search
     *                   string before using it. Converting to number for example.
     * {func} dehydrator - Any transformation to apply to the value before adding it
     *                     to the search. Converting a number to string for example.
     * {string|num} default - Default value. To note that when a state value is
     *                        default it won't go to the search string.
     * {array|func} validator - Validator function for the value. If is an array
     *                          should contain valid options. If it is a function
     *                          should return true or false.
     *
     * @param {object} definition The definition object.
     *
     */
    function useQsState(def) {
      const mounted = useRef(false);

      // Setup defaults.
      const {
        // Function to convert the value from the string before using it.
        hydrator = (v) => v,
        // Function to convert the value to the string before using it.
        dehydrator = (v) => v
      } = def;

      // Location search
      const locSearch = location.search;

      // Get the correct validator. Array of items, function or default.
      const validator = (v) => {
        if (def.validator && typeof def.validator.indexOf === 'function') {
          return def.validator.indexOf(v) !== -1;
        } else if (typeof def.validator === 'function') {
          return def.validator(v);
        } else {
          return !!v;
        }
      };

      // Parse the value from the url.
      const getValueFromURL = (searchString) => {
        const parsedQS = qs.parse(searchString, { ignoreQueryPrefix: true });

        // Hydrate the value:
        // Convert from a string to the final type.
        const value = hydrator(parsedQS[def.key]);

        return validator(value) ? value : def.default;
      };

      // Store the state relative to this qs key.
      const [valueState, setValueState] = useState(getValueFromURL(locSearch));

      // We need a ref to store the state value, otherwise the closure created by
      // the useEffect always shows the original value. We can't pass the value as
      // a dependency of useEffect otherwise it would keep changing itself.
      // Similar issue:
      // https://stackoverflow.com/questions/57847594/react-hooks-accessing-up-to-date-state-from-within-a-callback
      const stateRef = useRef();
      stateRef.current = valueState;

      const setValue = (value) => {
        const v = validator(value) ? value : def.default;
        // Dehydrate the value:
        // Convert to a string usable in the url.
        const dehydratedVal = dehydrator(v);

        // Store value in state.
        setValueState(v);

        // Because defaults can be objects, we compare on the dehydrated value.
        const dehydratedDefaultVal = dehydrator(def.default);
        storeInURL(
          def.key,
          dehydratedVal !== dehydratedDefaultVal ? dehydratedVal : null
        );
      };

      // "Listen" to url changes and replace only if different from the currently
      // stored state.
      useEffect(() => {
        // Ensure this check only runs once the component mounted.
        // The initial url setting is done when the state is initialized.
        if (!mounted.current) {
          mounted.current = true;
          return;
        }

        const v = getValueFromURL(locSearch);
        if (!isEqualObj(v, stateRef.current)) {
          setValueState(v);
        }
        /* eslint-disable-next-line react-hooks/exhaustive-deps */
      }, [locSearch, def]);

      return [valueState, setValue];
    }

    // This version is just a way to make the use with memo quicker.
    useQsState.memo = function useQsStateMemoized(v) {
      /* eslint-disable-next-line react-hooks/exhaustive-deps */
      return useQsState(useMemo(() => v, []));
    };

    return useQsState;
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [commitToLocation]);
}

export default useQsStateCreator;
