/* eslint-disable prettier/prettier */
declare module 'qs-state-hook' {
  interface QsStateCreatorOptions {
    commit?: (args: { search: string }) => void;
    location?: Location;
  }

  interface QsStateDefinition<T> {
    /** Key name to use on the search string */
    key: string;

    /**
     * Default value. Note that when a state value is default it won't go to the
     * search string.
     */
    default: T | null;

    /**
     * Any transformation to apply to the value from the search string before
     * using it. Converting to number for example.
     */
    hydrator?: (value?: string) => T;

    /**
     * Any transformation to apply to the value before adding it to the search.
     * Converting a number to string for example.
     */
    dehydrator?: (value: T) => string;

    /**
     * Validator function for the value.
     * If is an array should contain valid options. If it is a function should
     * return true or false.
     */
    validator?: ((value: T) => boolean) | Array<T>;
  }

  /**
   * Qs State is used to sync a state object with url search string. It will
   * keep the state value in sync with the url. The value will be validated
   * according to the definition.
   */
   type QsStateHook = {
    <T>(definition: QsStateDefinition<T>): [T | null, (value: any) => void];
    /**
     * Memo version of useQsState.
     * Avoids having to do useQsState(useMemo(() => ({ key: 'foo' }), []))
     */
    memo: <T>(definition: QsStateDefinition<T>, deps: React.DependencyList) => [T | null, (value: any) => void];
  }

  /**
   * Creator of a qsStateHook
   */
  export default function useQsStateCreator(
    options: QsStateCreatorOptions
  ): QsStateHook;
}
