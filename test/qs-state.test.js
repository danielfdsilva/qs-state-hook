import { act, renderHook } from '@testing-library/react-hooks';
import { renderHook as renderHookServer } from '@testing-library/react-hooks/server';
import sinon from 'sinon';
import { useMemo } from 'react';

import useQsStateCreator from '../src';
import { COMMIT_DELAY } from '../src/qs-state-hook';

const noop = () => {};

describe('QS State Hook', () => {
  it('parses value from URL', () => {
    const location = {
      search: '?something=else&val=cat'
    };

    const { result } = renderHook(() => {
      const useQsState = useQsStateCreator({
        commit: noop,
        location
      });

      return useQsState(
        useMemo(
          () => ({
            key: 'val'
          }),
          []
        )
      );
    });

    const [value, setValue] = result.current;
    expect(value).toBe('cat');
    expect(typeof setValue).toBe('function');
  });

  it('parses multiples values from URL', () => {
    const location = {
      search: '?val2=tulip&val=cat'
    };

    const { result } = renderHook(() => {
      const useQsState = useQsStateCreator({
        commit: noop,
        location
      });

      const [val] = useQsState(
        useMemo(
          () => ({
            key: 'val'
          }),
          []
        )
      );
      const [val2] = useQsState(
        useMemo(
          () => ({
            key: 'val2'
          }),
          []
        )
      );
      return { val, val2 };
    });

    expect(result.current.val).toBe('cat');
    expect(result.current.val2).toBe('tulip');
  });

  it('uses value from when initialized', () => {
    const location = {
      search: '?val=cat'
    };

    // For this test we use the server version of renderHook to ensure that the
    // qsState's internal useEffect doesn't run. This is needed to ensure that
    // we can test the initial value, otherwise we'd only test after the
    // useEffect runs and miss capturing that first react render between the
    // state initialization and setting the value through useEffect
    const { result } = renderHookServer(() => {
      const useQsState = useQsStateCreator({
        commit: noop,
        location
      });

      return useQsState(
        useMemo(
          () => ({
            key: 'val'
          }),
          []
        )
      );
    });

    const [value, setValue] = result.current;
    expect(value).toBe('cat');
    expect(typeof setValue).toBe('function');
  });

  it('uses default when value is not in url', () => {
    const location = {
      search: '?something=else'
    };

    const { result } = renderHook(() => {
      const useQsState = useQsStateCreator({
        commit: noop,
        location
      });

      return useQsState(
        useMemo(
          () => ({
            key: 'val',
            default: 'cat'
          }),
          []
        )
      );
    });

    const [value, setValue] = result.current;
    expect(value).toBe('cat');
    expect(typeof setValue).toBe('function');
  });

  it('updates the value when there is a rerender and the url changed', () => {
    const location = {
      search: '?something=else&val=cat'
    };

    const { result, rerender } = renderHook(() => {
      const useQsState = useQsStateCreator({
        commit: noop,
        location
      });

      return useQsState(
        useMemo(
          () => ({
            key: 'val'
          }),
          []
        )
      );
    });

    expect(result.current[0]).toBe('cat');

    // Changing the location does not trigger a rerender. That's the job of the
    // routing engine and not part of the QS State. This is by design!
    location.search = '?val=dog';
    rerender();

    expect(result.current[0]).toBe('dog');
  });

  it('updates the state value when setting new value', () => {
    const location = {
      search: '?val=cat'
    };

    const { result } = renderHook(() => {
      const useQsState = useQsStateCreator({
        commit: noop,
        location
      });

      return useQsState(
        useMemo(
          () => ({
            key: 'val'
          }),
          []
        )
      );
    });

    expect(result.current[0]).toBe('cat');

    act(() => {
      const [, setValue] = result.current;
      setValue('ferret');
    });

    expect(result.current[0]).toBe('ferret');
  });

  it('updates the state value when setting new value - memoized', () => {
    const location = {
      search: '?val=cat'
    };

    const { result } = renderHook(() => {
      const useQsState = useQsStateCreator({
        commit: noop,
        location
      });

      return useQsState.memo({
        key: 'val'
      });
    });

    expect(result.current[0]).toBe('cat');

    act(() => {
      const [, setValue] = result.current;
      setValue('ferret');
    });

    expect(result.current[0]).toBe('ferret');
  });

  it('uses hydrator function to get value from url', () => {
    const hydratorMock = jest.fn(() => 'mocked hydrated');
    const location = {
      search: '?val=cat'
    };

    const { result } = renderHook(() => {
      const useQsState = useQsStateCreator({
        commit: noop,
        location
      });

      return useQsState(
        useMemo(
          () => ({
            key: 'val',
            hydrator: hydratorMock
          }),
          []
        )
      );
    });

    // The function was called exactly once
    expect(hydratorMock.mock.calls.length).toBe(1);

    // The first arg of the first call to the function was the value in the url.
    expect(hydratorMock.mock.calls[0][0]).toBe('cat');
    expect(result.current[0]).toBe('mocked hydrated');
  });

  it('uses validator function and returns value when valid', () => {
    const validatorMock = jest.fn(() => true);
    const location = {
      search: '?val=cat'
    };

    const { result } = renderHook(() => {
      const useQsState = useQsStateCreator({
        commit: noop,
        location
      });

      return useQsState(
        useMemo(
          () => ({
            key: 'val',
            validator: validatorMock
          }),
          []
        )
      );
    });

    // The function was called exactly once
    expect(validatorMock.mock.calls.length).toBe(1);

    // The first arg of the first call to the function was the value in the url.
    expect(validatorMock.mock.calls[0][0]).toBe('cat');
    expect(result.current[0]).toBe('cat');
  });

  it('uses validator function and returns default when fails', () => {
    const validatorMock = jest.fn(() => false);
    const location = {
      search: '?val=cat'
    };

    const { result } = renderHook(() => {
      const useQsState = useQsStateCreator({
        commit: noop,
        location
      });

      return useQsState(
        useMemo(
          () => ({
            key: 'val',
            default: 'ferret',
            validator: validatorMock
          }),
          []
        )
      );
    });

    // The function was called exactly once
    expect(validatorMock.mock.calls.length).toBe(1);

    // The first arg of the first call to the function was the value in the url.
    expect(validatorMock.mock.calls[0][0]).toBe('cat');
    expect(result.current[0]).toBe('ferret');
  });

  it('uses validator array of options and returns value when valid', () => {
    const location = {
      search: '?val=cat'
    };

    const validValues = ['cat', 'ferret', 'dog', 'bird'];

    const { result } = renderHook(() => {
      const useQsState = useQsStateCreator({
        commit: noop,
        location
      });

      return useQsState(
        useMemo(
          () => ({
            key: 'val',
            validator: validValues
          }),
          []
        )
      );
    });

    expect(result.current[0]).toBe('cat');
  });

  it('uses validator array of options and returns default when fails', () => {
    const location = {
      search: '?val=cat'
    };

    const validValues = ['ferret', 'dog', 'bird'];

    const { result } = renderHook(() => {
      const useQsState = useQsStateCreator({
        commit: noop,
        location
      });

      return useQsState(
        useMemo(
          () => ({
            key: 'val',
            default: validValues[0],
            validator: validValues
          }),
          []
        )
      );
    });

    expect(result.current[0]).toBe('ferret');
  });

  it('uses validator when setting new value', () => {
    const location = {
      search: '?val=cat'
    };

    const validValues = ['cat', 'dog', 'bird'];

    const { result } = renderHook(() => {
      const useQsState = useQsStateCreator({
        commit: noop,
        location
      });

      return useQsState(
        useMemo(
          () => ({
            key: 'val',
            default: validValues[0],
            validator: validValues
          }),
          []
        )
      );
    });

    expect(result.current[0]).toBe('cat');

    act(() => {
      const [, setValue] = result.current;
      setValue('dinosaur');
    });

    expect(result.current[0]).toBe('cat');
  });

  it('updates url after setting value', () => {
    const clock = sinon.useFakeTimers();

    const commitMock = jest.fn();
    const location = {
      search: '?val=cat'
    };

    const { result } = renderHook(() => {
      const useQsState = useQsStateCreator({
        commit: commitMock,
        location
      });

      return useQsState(
        useMemo(
          () => ({
            key: 'val'
          }),
          []
        )
      );
    });

    act(() => {
      const [, setValue] = result.current;
      setValue('ferret');
    });

    expect(commitMock.mock.calls.length).toBe(0);

    clock.tick(COMMIT_DELAY / 2);
    expect(commitMock.mock.calls.length).toBe(0);

    // QS State waits 100ms before committing to the url to ensure that batch
    // requests are processed as one.
    clock.tick(COMMIT_DELAY);

    // The function was called exactly once
    expect(commitMock.mock.calls.length).toBe(1);

    // The first arg of the first call to the function was the value in the url.
    expect(commitMock.mock.calls[0][0]).toStrictEqual({ search: 'val=ferret' });
    clock.restore();
  });

  it('updates url after setting value leaving other url values untouched', () => {
    const clock = sinon.useFakeTimers();

    const commitMock = jest.fn();
    const location = {
      search: '?val=cat&type=3&color=teal'
    };

    const { result } = renderHook(() => {
      const useQsState = useQsStateCreator({
        commit: commitMock,
        location
      });

      return useQsState(
        useMemo(
          () => ({
            key: 'val'
          }),
          []
        )
      );
    });

    act(() => {
      const [, setValue] = result.current;
      setValue('ferret');
    });

    // QS State waits 100ms before committing to the url to ensure that batch
    // requests are processed as one.
    clock.tick(COMMIT_DELAY);

    // The function was called exactly once
    expect(commitMock.mock.calls.length).toBe(1);
    expect(commitMock.mock.calls[0][0]).toStrictEqual({
      search: 'val=ferret&type=3&color=teal'
    });
    clock.restore();
  });

  it('updates url once after setting values within threshold', () => {
    const clock = sinon.useFakeTimers();

    const commitMock = jest.fn();
    const location = {
      search: '?val=cat&color=teal'
    };

    const { result } = renderHook(() => {
      const useQsState = useQsStateCreator({
        commit: commitMock,
        location
      });

      const [, setVal] = useQsState(
        useMemo(
          () => ({
            key: 'val'
          }),
          []
        )
      );
      const [, setColor] = useQsState(
        useMemo(
          () => ({
            key: 'color'
          }),
          []
        )
      );

      return {
        setVal,
        setColor
      };
    });

    act(() => {
      result.current.setVal('ferret');
    });

    clock.tick(COMMIT_DELAY / 2);

    act(() => {
      result.current.setColor('red');
    });

    // QS State waits 100ms before committing to the url to ensure that batch
    // requests are processed as one.
    clock.tick(COMMIT_DELAY);

    // The function was called exactly once
    expect(commitMock.mock.calls.length).toBe(1);
    expect(commitMock.mock.calls[0][0]).toStrictEqual({
      search: 'val=ferret&color=red'
    });
    clock.restore();
  });

  it('updates url multiple times when setting values after threshold', () => {
    const clock = sinon.useFakeTimers();

    const commitMock = jest.fn();
    const location = {
      search: '?val=cat&color=teal'
    };

    const { result, rerender } = renderHook(() => {
      const useQsState = useQsStateCreator({
        commit: commitMock,
        location
      });

      const [, setVal] = useQsState(
        useMemo(
          () => ({
            key: 'val'
          }),
          []
        )
      );
      const [, setColor] = useQsState(
        useMemo(
          () => ({
            key: 'color'
          }),
          []
        )
      );

      return {
        setVal,
        setColor
      };
    });

    act(() => {
      result.current.setVal('ferret');
    });

    clock.tick(COMMIT_DELAY);

    expect(commitMock.mock.calls.length).toBe(1);
    expect(commitMock.mock.calls[0][0]).toStrictEqual({
      search: 'val=ferret&color=teal'
    });

    // This update would cause the url to be changed and a component rerender
    // which we have to simulate.
    location.search = '?val=ferret&color=teal';
    rerender();

    act(() => {
      result.current.setColor('red');
    });

    clock.tick(COMMIT_DELAY);

    // The function was called twice.
    expect(commitMock.mock.calls.length).toBe(2);
    expect(commitMock.mock.calls[1][0]).toStrictEqual({
      search: 'val=ferret&color=red'
    });
    clock.restore();
  });

  it('uses dehydrator function to convert to url value', () => {
    const clock = sinon.useFakeTimers();

    const dehydratorMock = jest.fn((v) => `mocked-dehydrated--${v}`);
    const commitMock = jest.fn();
    const location = {
      search: '?val=cat'
    };

    const { result } = renderHook(() => {
      const useQsState = useQsStateCreator({
        commit: commitMock,
        location
      });

      return useQsState(
        useMemo(
          () => ({
            key: 'val',
            dehydrator: dehydratorMock
          }),
          []
        )
      );
    });

    act(() => {
      const [, setVal] = result.current;
      setVal('ferret');
    });

    // The dehydrator is called with the set value.
    expect(dehydratorMock.mock.calls[0][0]).toBe('ferret');
    // Since the value is valid it get stored in the state.
    expect(result.current[0]).toBe('ferret');

    clock.tick(COMMIT_DELAY);

    expect(commitMock.mock.calls.length).toBe(1);
    // The dehydrated value ends up on the url.
    expect(commitMock.mock.calls[0][0]).toStrictEqual({
      search: 'val=mocked-dehydrated--ferret'
    });
    clock.restore();
  });

  it('removes value from url when it matches default', () => {
    const clock = sinon.useFakeTimers();
    const commitMock = jest.fn();
    const location = {
      search: '?val=cat'
    };

    const { result } = renderHook(() => {
      const useQsState = useQsStateCreator({
        commit: commitMock,
        location
      });

      return useQsState(
        useMemo(
          () => ({
            key: 'val',
            default: 'ferret'
          }),
          []
        )
      );
    });

    expect(result.current[0]).toBe('cat');

    act(() => {
      const [, setVal] = result.current;
      setVal('ferret');
    });

    // Since the value is valid it get stored in the state.
    expect(result.current[0]).toBe('ferret');

    clock.tick(COMMIT_DELAY);

    expect(commitMock.mock.calls.length).toBe(1);
    // The url becomes empty because the value is the default.
    expect(commitMock.mock.calls[0][0]).toStrictEqual({
      search: ''
    });
    clock.restore();
  });

  it('removes value from url when it matches default keeping other values', () => {
    const clock = sinon.useFakeTimers();
    const commitMock = jest.fn();
    const location = {
      search: '?val=cat&color=teal'
    };

    const { result } = renderHook(() => {
      const useQsState = useQsStateCreator({
        commit: commitMock,
        location
      });

      return useQsState(
        useMemo(
          () => ({
            key: 'val',
            default: 'ferret'
          }),
          []
        )
      );
    });

    expect(result.current[0]).toBe('cat');

    act(() => {
      const [, setVal] = result.current;
      setVal('ferret');
    });

    // Since the value is valid it get stored in the state.
    expect(result.current[0]).toBe('ferret');

    clock.tick(COMMIT_DELAY);

    expect(commitMock.mock.calls.length).toBe(1);
    // The url becomes empty because the value is the default.
    expect(commitMock.mock.calls[0][0]).toStrictEqual({
      search: 'color=teal'
    });
    clock.restore();
  });

  it('should handle objects as default', () => {
    const clock = sinon.useFakeTimers();
    const commitMock = jest.fn();
    const location = {
      search: '?val=ferret|3'
    };

    const complexDefault = {
      count: 1,
      type: 'cat',
      other: 'default prop never on URL'
    };

    const qsDef = {
      key: 'val',
      default: complexDefault,
      dehydrator: (v) => {
        return `${v.type}|${v.count}`;
      },
      hydrator: (v) => {
        if (!v) return null;
        const [type, count] = v.split('|');
        return { ...complexDefault, type, count: parseInt(count) };
      }
    };

    const { result } = renderHook(() => {
      const useQsState = useQsStateCreator({
        commit: commitMock,
        location
      });
      return useQsState(qsDef);
    });

    expect(result.current[0]).toStrictEqual({
      count: 3,
      type: 'ferret',
      other: 'default prop never on URL'
    });

    act(() => {
      const [, setVal] = result.current;
      // When working with complex objects we always have to set it all.
      // There's no merge process involved.
      setVal({
        count: 1,
        type: 'cat',
        other: 'default prop never on URL'
      });
    });

    clock.tick(COMMIT_DELAY);

    expect(commitMock.mock.calls.length).toBe(1);
    // The url becomes empty because the value is the default.
    expect(commitMock.mock.calls[0][0]).toStrictEqual({
      search: ''
    });
    clock.restore();
  });
});
