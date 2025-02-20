import React, { createRef } from 'react';
import PropTypes from 'prop-types';
import { connect,  } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import DatePicker from 'react-date-picker';
import AudioPlayer from 'react-h5-audio-player';
import { compose } from 'redux';

import CalendarIcon from './Icons/CalendarIcon';
import Chevron from './Icons/Chevron';
import Hour24 from './Icons/Hour24';
import ForwardIcon from './Icons/ForwardIcon';
import HeadphonesIcon from './Icons/HeadphonesIcon'
import TimesIcon from './Icons/Times';

import {
  isFalsy,
  toAngURL,
  toNavURL,
  dateMath,
  getSourceId,
  getWriter,
  getRaag,
  checkAPIHealth,
  getShabadAudioUrl
} from '@/util';
import { TEXTS, PAGE_NAME, FIRST_HUKAMNAMA_DATE, HUKAMNAMA_AUDIO_URL } from '@/constants';
import PlayerViewButton from './PlayerViewButton';
import PlayerCloseButton from './PlayerCloseButton';

/**
 *
 *
 * @export
 * @class Meta
 * @augments {React.PureComponent<MetaProps>}
 */
class Meta extends React.PureComponent {

  constructor(props) {
    super(props)
    this.state = {
      audioPlayer: null,
      isHukamnamaAudioPlayerVisible: true,
      shabadURL: '',
      isShabadPlayable: false,
    }
    this.audioPlayerRef = createRef();
    this.audioPlayerIconRef = createRef();
    this.wrapperRef = createRef();
  }
  static defaultProps = {
    nav: {},
  };

  /**
   * @typedef {object} MetaProps
   * @property {ShabadContentTypes} type
   * @property {object} info
   * @property {array} translationLanguages
   * @property {array} transliterationLanguages
   * @property {object} nav
   * @property {boolean} isUnicode
   * @property {boolean} isArrowsHidden
   *
   * @static
   * @memberof Meta
   */
  static propTypes = {
    history: PropTypes.object.isRequired,
    type: PropTypes.string.isRequired,
    info: PropTypes.object.isRequired,
    translationLanguages: PropTypes.array.isRequired,
    transliterationLanguages: PropTypes.array.isRequired,
    isUnicode: PropTypes.bool.isRequired,
    nav: PropTypes.shape({
      current: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      previous: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      next: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }),
    isArrowsHidden: PropTypes.bool,
    showPinSettings: PropTypes.bool,
    showShabadAudioPlayer: PropTypes.bool,
  };

  renderLeftArrow() {
    const {
      type,
      nav = {},
      isArrowsHidden,
    } = this.props;

    const link = toNavURL(this.props);
    const isShowPreviousArrow = isFalsy(nav.previous) === false;
    const isSync = type === 'sync';
    const isHukamnama = type === 'hukamnama';

    if (!isArrowsHidden) {
      if (isShowPreviousArrow) {
        return (
          <div className="shabad-nav left">
            <Link to={link + nav.previous}>
              {isHukamnama ? (
                <div className='hukamnama-nav-icon'>
                  <Hour24 direction='previous' />
                  <span>{dateMath.expand(nav.previous, false)}</span>
                </div>
              ) : (
                <Chevron direction={Chevron.DIRECTIONS.LEFT} />
              )}
            </Link>
          </div>
        )
      }
      if (!isSync) {
        return (
          <div className="shabad-nav left disabled-nav">
            <a>
              {isHukamnama ? (
                <Hour24 direction='previous' />
              ) : (
                <Chevron direction={Chevron.DIRECTIONS.LEFT} />
              )}
            </a>
          </div>
        )
      }
    }

    return '';
  }


  renderRightArrow() {
    const {
      type,
      nav = {},
      isArrowsHidden,
    } = this.props;

    const isShowNextArrow = isFalsy(nav.next) === false
    const isSync = type === 'sync';
    const isHukamnama = type === 'hukamnama';

    if (!isArrowsHidden) {

      if (isShowNextArrow) {
        return (
          <div className="shabad-nav right">
            <a role="button" aria-label="next" onClick={this.goToNextAng}>
              {isHukamnama ? (
                <div className='hukamnama-nav-icon'>
                  <Hour24 direction='next' />
                  <span>{dateMath.expand(nav.next, false)}</span>
                </div>
              ) : (
                <Chevron direction={Chevron.DIRECTIONS.RIGHT} />
              )}
            </a>
          </div>
        )
      }

      if (!isSync) {
        return (
          <div className="shabad-nav right disabled-nav">
            <a>
              {isHukamnama ? (
                <Hour24 direction='next' />
              ) : (
                <Chevron direction={Chevron.DIRECTIONS.RIGHT} />
              )}
            </a>
          </div>
        )
      }
    }

    return '';
  }

  setShabadURL = (url) => {
    this.setState(previousState => {
      return ({
        ...previousState,
        shabadURL: url
      })
    })
  }

  setHukamnamaAudioPlayerVisibility = (e) => {
    e.preventDefault();
    const audioPlayer = this.audioPlayerRef.current.audio.current;

    this.setState(previousState => {
      // console.log('set state 2 times got hit')
      const isAudioPlayerState = !previousState.isHukamnamaAudioPlayerVisible;

      !isAudioPlayerState && audioPlayer.pause();

      return ({
        ...previousState,
        isHukamnamaAudioPlayerVisible: !previousState.isHukamnamaAudioPlayerVisible
      })
    })
  }

  removeAudioPlayer = (e) => {
    return this.setHukamnamaAudioPlayerVisibility(e);
  }

  async componentDidMount() {
    if (this.props.type === 'shabad' ) {
      const healthy = await checkAPIHealth()
      if (healthy) {
        const audioUrl = await getShabadAudioUrl(this.props.info);
        this.setShabadURL(audioUrl);
      }
    }
  }

  render() {
    const {
      type,
      info,
      nav,
      isUnicode,
      translationLanguages,
      transliterationLanguages,
      showPinSettings,
      showShabadAudioPlayer
    } = this.props;
    const Item = ({ children, last = false }) =>
      children ? (
        <React.Fragment>
          {children}
          {last ? '' : ' - '}
        </React.Fragment>
      ) : null;

    const shouldShowEnglishInHeader =
      translationLanguages.includes('english') ||
      transliterationLanguages.includes('english');
    const contentType = isUnicode ? 'unicode' : 'gurmukhi';
    const isHukamnama = type === 'hukamnama';
    const todayDate = new Date(new Date().toDateString());
    const hukamnamaDate = new Date(nav.current);
    const maximumHukamnamaDate = new Date(todayDate);
    const hasAudioPlayer = isHukamnama;
    const isShabadPlayable = !!this.state.shabadURL;
    // hukamnamaDate.getTime() == todayDate.getTime();

    return (
      <div ref={this.wrapperRef} id="metadata" className={`metadata-${type}`}>
        {!isHukamnama && this.renderLeftArrow()}

        <div className="meta">
          {isHukamnama && (
            <>
              <div className="meta-hukamnama">
                <div className="meta-hukamnama-left">
                  <div className="meta-hukamnama-left-row">
                    <DatePicker
                      isOpen={this.state.isCalendarOpen}
                      clearIcon={null}
                      onCalendarClose={() => {
                        this.setState(() => ({ isCalendarOpen: false }))
                      }}
                      onCalendarOpen={() => {
                        this.setState(() => ({ isCalendarOpen: true }))
                      }}
                      onChange={this.goToParticularHukamnama}
                      value={hukamnamaDate}
                      maxDate={maximumHukamnamaDate}
                      minDate={new Date(FIRST_HUKAMNAMA_DATE)}
                      calendarIcon={<CalendarIcon width={20} />}
                      calendarAriaLabel="date picker"
                    />
                    <a className="hukam-text-link" onClick={this.state.isCalendarOpen ? undefined : (e) => {
                      e.preventDefault();
                      return this.setState(() => ({ isCalendarOpen: true }))
                    }}>
                      <span title="Past Hukamnamas">Archive</span>
                    </a>
                  </div>
                  <div className="meta-hukamnama-left-gotoshabad">

                    <Link className="hukamnama-right-link" to={`/shabad?id=${info.shabadId}`}>
                      <ForwardIcon />{TEXTS.GO_TO_SHABAD}
                    </Link>
                  </div>
                </div>
                <h4>
                  {TEXTS.HUKAMNAMA_HEADING}, <span>{nav.current}</span>
                </h4>
                <div ref={this.audioPlayerIconRef} role='button' className="meta-hukamnama-right" onClick={this.setHukamnamaAudioPlayerVisibility}>
                  <span className="hukamnama-right-headphonesIcon"><HeadphonesIcon /><a title="Listen to Today's Hukamnama">{`Today's Hukamnama`}</a></span>
                </div>
              </div>
            </>
          )}
          <h4 className="gurbani-font">
            <Item>
              {getRaag(info) &&
                getRaag(info)[contentType] &&
                getRaag(info)[contentType] !== 'null' &&
                getRaag(info)[contentType]}
            </Item>
            <Item>{getWriter(info) && getWriter(info)[contentType]}</Item>
            <Item>{info.source[contentType]}</Item>
            {info.source.pageNo !== null && (
              <Item last>
                <Link
                  to={toAngURL({
                    ang: info.source.pageNo,
                    source: getSourceId(info),
                  })}
                >
                  {getSourceId(info) == 'G' ? PAGE_NAME.ANG[contentType] : PAGE_NAME.PANNA[contentType]}{' '}
                  {info.source.pageNo}
                </Link>
              </Item>
            )}
          </h4>

          {shouldShowEnglishInHeader && (
            <h4>
              <Item>
                {getRaag(info) &&
                  getRaag(info)['english'] &&
                  getRaag(info)['english'] !== 'null' &&
                  getRaag(info)['english']}
              </Item>
              <Item>{getWriter(info) && getWriter(info)['english']}</Item>
              <Item>{info.source.english}</Item>
              {info.source.pageNo !== null && (
                <Item last>
                  <Link
                    to={toAngURL({
                      ang: info.source.pageNo,
                      source: getSourceId(info),
                    })}
                  >
                    {getSourceId(info) == 'G' ? 'Ang' : 'Pannaa'}{' '}
                    {info.source.pageNo}
                  </Link>
                </Item>
              )}
            </h4>
          )}
          {isShabadPlayable && 
            (<div ref={this.audioPlayerIconRef} role='button' className="meta-hukamnama-right">
              <PlayerViewButton/>
            </div>)
          }
        </div>

        {hasAudioPlayer && (
          <div className={`hukamnama-audio ${this.state.isHukamnamaAudioPlayerVisible ? 'hukamnama-audio--shown' : 'hukamnama-audio--hidden'} ${showPinSettings ? 'hukamnama-audio--pin-settings' : ''}`}>
            <AudioPlayer
              ref={this.audioPlayerRef}
              src={HUKAMNAMA_AUDIO_URL}
              customAdditionalControls={[]}
              customVolumeControls={[]}
              header={(
                <div>
                  <h3 className="hukamnama-player-title">{`Listen to Today's Hukamnama`}</h3>
                  <span className="hukamnama-player-close-icon">
                    <TimesIcon onClick={this.removeAudioPlayer} />
                  </span>
                </div>
              )}
              />
          </div>)}

        {!isHukamnama && this.renderRightArrow()}
          
        {isShabadPlayable && showShabadAudioPlayer && (
          <div className={`hukamnama-audio ${(this.state.isHukamnamaAudioPlayerVisible && isShabadPlayable) ? 'hukamnama-audio--shown' : 'hukamnama-audio--hidden'} ${showPinSettings ? 'hukamnama-audio--pin-settings' : ''}`}>
          <AudioPlayer
              ref={this.audioPlayerRef}
              src={this.state.shabadURL}
              customAdditionalControls={[]}
              customVolumeControls={[]}
              header={(
                <div>
                  <h3 className="shabad-player-title">Shabad player</h3>
                  <PlayerCloseButton />
                </div>
              )}
              footer={(
                <div>
                  <h4 className='shabad-player-footer'>Courtesy: Baru Sahib</h4>
                </div>
              )}
            />
          </div>
        )}
      </div >
    );
  }
  
  /**
   * Handle SaveAng
   * @memberof Meta
   */

  goToParticularHukamnama = (date) => {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const day = date.getDate();

    const hukamnamaDate = `${year}/${month}/${day}`;
    const link = toNavURL(this.props)
    this.props.history.push(link + hukamnamaDate);
  }
  goToNextAng = () => {
    const link = toNavURL(this.props);
    this.props.history.push(link + this.props.nav.next);
  };
  
}

const mapStateToProps = state => ({ showShabadAudioPlayer: state.showShabadAudioPlayer })
export default compose(
  withRouter,
  connect(mapStateToProps)
)(Meta);
