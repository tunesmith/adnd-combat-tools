import styles from './dungeon.module.css';
import { DungeonFeed, renderNode } from '../../components/dungeon/DungeonFeed';
import { useDungeonPageState } from '../../components/dungeon/useDungeonPageState';

const DungeonIndexPage = () => {
  const {
    session,
    action,
    setAction,
    rollInput,
    setRollInput,
    feed,
    setFeed,
    clearFeed,
    detailMode,
    setDetailMode,
    overrides,
    setOverrides,
    dungeonLevel,
    setDungeonLevel,
    collapsed,
    setCollapsed,
    resolved,
    setResolved,
    liveRegionRef,
    isValid,
    handleRoll,
    handleRollInputKeyDown,
    copyReplayInfo,
    replayStatus,
    hasReplayInfo,
    recordPreviewResolution,
  } = useDungeonPageState();

  return (
    <div className={styles['outerContainer']}>
      <div className={styles['title']}>AD&D Random Dungeon Generator</div>
      <div className={styles['contentContainer']}>
        <div className={styles['toolbar']}>
          <div className={styles['toolbarGroup']}>
            <button
              type="button"
              className={styles['button']}
              onClick={clearFeed}
            >
              Clear Feed
            </button>
          </div>
        </div>
        <div className={styles['formContainer']}>
          <div className={styles['controlSections']}>
            <section className={styles['controlSection']}>
              <div className={styles['generateLayout']}>
                <div className={styles['triggerGroup']}>
                  <div className={styles['fieldLabel']}>Start from</div>
                  <div
                    className={styles['actionSegmentedControl']}
                    role="radiogroup"
                    aria-label="Starting trigger"
                  >
                    <label
                      className={`${styles['actionOption']} ${
                        action === 'passage' ? styles['actionOptionActive'] : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="action"
                        value="passage"
                        checked={action === 'passage'}
                        onChange={() => setAction('passage')}
                      />
                      <span>Passage</span>
                    </label>
                    <label
                      className={`${styles['actionOption']} ${
                        action === 'door' ? styles['actionOptionActive'] : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="action"
                        value="door"
                        checked={action === 'door'}
                        onChange={() => setAction('door')}
                      />
                      <span>Door</span>
                    </label>
                  </div>
                </div>

                <div className={styles['rollGroup']}>
                  <div className={styles['rollActions']}>
                    <button
                      type="button"
                      className={`${styles['button']} ${styles['buttonPrimary']} ${styles['controlButton']}`}
                      onClick={handleRoll}
                      aria-label="Automatically roll a d20 and submit"
                    >
                      AutoRoll
                    </button>
                  </div>
                  <div className={styles['rollDivider']}>-OR-</div>
                  <label className={styles['fieldGroup']}>
                    <span className={styles['fieldLabel']}>d20 Roll</span>
                    <input
                      className={`${styles['fieldControl']} ${styles['rollInput']}`}
                      type="number"
                      min={1}
                      max={20}
                      inputMode="numeric"
                      value={rollInput}
                      onChange={(event) => setRollInput(event.target.value)}
                      onKeyDown={handleRollInputKeyDown}
                      aria-invalid={rollInput.length > 0 && !isValid}
                    />
                  </label>
                </div>

                <label
                  className={`${styles['fieldGroup']} ${styles['contextGroup']}`}
                >
                  <span className={styles['fieldLabel']}>Dungeon level</span>
                  <select
                    className={`${styles['fieldControl']} ${styles['levelInput']}`}
                    value={dungeonLevel}
                    onChange={(event) =>
                      setDungeonLevel(Number(event.target.value) || 1)
                    }
                  >
                    {Array.from({ length: 16 }, (_, index) => index + 1).map(
                      (value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      )
                    )}
                  </select>
                </label>
              </div>
            </section>
          </div>

          {rollInput.length > 0 && !isValid && (
            <div className={styles['errorText']}>Enter an integer 1–20.</div>
          )}
        </div>

        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            overflow: 'hidden',
            clip: 'rect(1px, 1px, 1px, 1px)',
          }}
          ref={liveRegionRef}
        />

        <div className={styles['feed']}>
          <div className={styles['feedHeader']}>
            <div className={styles['feedModeDock']}>
              <div
                className={styles['segmentedControl']}
                role="radiogroup"
                aria-label="Feed view"
              >
                <label
                  className={`${styles['segmentOption']} ${
                    !detailMode ? styles['segmentOptionActive'] : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="view-mode"
                    checked={!detailMode}
                    onChange={() => setDetailMode(false)}
                  />
                  Compact
                </label>
                <label
                  className={`${styles['segmentOption']} ${
                    detailMode ? styles['segmentOptionActive'] : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="view-mode"
                    checked={detailMode}
                    onChange={() => setDetailMode(true)}
                  />
                  Detail
                </label>
              </div>
            </div>
          </div>
          <DungeonFeed
            action={action}
            detailMode={detailMode}
            dungeonLevel={dungeonLevel}
            session={session}
            feed={feed}
            setDetailMode={setDetailMode}
            overrides={overrides}
            setOverrides={setOverrides}
            setFeed={setFeed}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            resolved={resolved}
            setResolved={setResolved}
            recordPreviewResolution={recordPreviewResolution}
          />
          <div className={styles['debugTools']}>
            {replayStatus && (
              <span className={styles['debugStatus']}>{replayStatus}</span>
            )}
            <button
              type="button"
              className={styles['debugButton']}
              onClick={copyReplayInfo}
              disabled={!hasReplayInfo}
            >
              Copy Replay Info
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { renderNode };

export default DungeonIndexPage;
