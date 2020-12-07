import React, { useState, useEffect, useMemo, useContext } from 'react';
import {
  InstantSearchConsumer,
  InstantSearchProvider,
} from 'react-instantsearch-core';
import { createConcurrentSafePromise } from '../lib/createConcurrentSafePromise';
import { debounce } from '../lib/debounce';

function DefaultAnswersComponent({ isLoading, hits = [] }) {
  return isLoading ? (
    <p>loading...</p>
  ) : (
    hits && hits.length > 0 && <pre>{JSON.stringify(hits, null, 2)}</pre>
  );
}

export default function Answers({
  searchClient,
  attributesForPrediction = ['*'],
  queryLanguages = ['en'],
  nbHits = 1,
  answersComponent: AnswersComponent = DefaultAnswersComponent,
}) {
  const isContext = useContext({
    Consumer: InstantSearchConsumer,
    Provider: InstantSearchProvider,
  });
  useEffect(() => {
    console.log('Here', { isContext });
    if (!isContext) {
      return;
    }
    const unsubcribe = isContext.store.subscribe(() => {
      console.log('state', isContext.store.getState());
    });
    return unsubcribe;
  }, [isContext]);
  const [query, setQuery] = useState();
  const [index, setIndex] = useState();
  const [isLoading, setIsLoading] = useState();
  const [hits, setHits] = useState();
  console.log({ query, index, isLoading, hits });
  const runConcurrentSafePromise = useMemo(
    () => createConcurrentSafePromise(),
    []
  );
  const searchIndex = useMemo(() => searchClient.initIndex(index), [
    searchClient,
    index,
  ]);
  useEffect(() => {
    // eslint-disable-next-line no-warning-comments
    // FIXME: remove this customization once the engine accepts url encoded query params
    if (searchClient.transporter) {
      searchClient.transporter.userAgent.value = 'answers-test';
    }
  }, [searchClient]);

  useEffect(() => {
    if (!query) {
      setIsLoading(false);
      setHits([]);
      return;
    }
    setIsLoading(true);
    runConcurrentSafePromise(
      searchIndex.findAnswers(query, queryLanguages, {
        nbHits,
        attributesForPrediction,
      })
    ).then(result => {
      setIsLoading(false);
      setHits(result.hits);
    });
  }, [query]);

  return null;
  // return (
  // <InstantSearchConsumer>
  //   {contextValue => {
  //     console.log('HEY', contextValue);
  //     const state = contextValue.store.getState();
  //     setIndex(state.results && state.results.index);
  //     setQuery(state.widgets.query);
  //     return <AnswersComponent hits={hits} isLoading={isLoading} />;
  //   }}
  // </InstantSearchConsumer>
  // );
}
