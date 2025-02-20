/* globals API_URL */
import React from 'react';
import PropTypes from 'prop-types';
import { buildApiUrl } from '@sttm/banidb';
import { TEXTS } from '../../constants';
import PageLoader from '../PageLoader';
import GenericError, { SachKaur } from '../../components/GenericError';
import Layout, { Stub } from './Layout';

export default class Search extends React.PureComponent {
  static defaultProps = {
    offset: 0,
  };

  static propTypes = {
    q: PropTypes.string.isRequired,
    type: PropTypes.number,
    source: PropTypes.string,
    offset: PropTypes.number,
    writer: PropTypes.string,
  };

  render() {
    const { q, type, source, offset, writer } = this.props;

    if (q === '') {
      return (
        <GenericError
          title={TEXTS.EMPTY_QUERY}
          description={TEXTS.EMPTY_QUERY_DESCRIPTION}
          image={SachKaur}
        />
      );
    }

    const url = encodeURI(
      buildApiUrl({ q, type, source, offset, writer, API_URL })
    );
    console.log(url, 'SEARCH RESULTS...');

    return (
      <PageLoader url={url}>
        {({ loading, data }) => {
          if (loading || data === undefined) return <Stub />;

          const { resultsInfo, verses } = data;

          return (
            <Layout
              pages={Array.from(
                Array(parseInt(resultsInfo.pages.totalPages)),
                (_, i) => i + 1
              )}
              totalResults={resultsInfo.totalResults || 0}
              resultsCount={resultsInfo.pageResults || 0}
              offset={offset}
              //nextPageOffset={resultsInfo.pages.page}
              shabads={verses}
              q={q}
              type={type}
              source={source}
              writer={writer}
            />
          );
        }}
      </PageLoader>
    );
  }
}
