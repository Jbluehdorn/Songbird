import { Link, useLocation } from 'react-router';
import { lastToolLocation, type Lesson, type SongProject } from '@songbird/song-core';
import {
  readLearningOrigin,
  toolNames,
  toolPath,
  type LearningNavigationState,
} from '../../app/routes';
import styles from '../../styles/workspace.module.css';

const topics: Record<Lesson, { title: string; summary: string; paragraphs: string[] }> = {
  keys: {
    title: 'What is a key?',
    summary: 'A musical home, not a rule about the first note.',
    paragraphs: [
      'A key gives music a sense of home around a tonic. A short melody can make sense in more than one key, so a suggested key is something to explore, not a verdict.',
      'C major and A minor share a set of notes, but have different tonal centers. Choosing C minor instead of C major also changes the scale. Keep both the tonic and the major or minor form in view.',
      'Choosing a key in Songbird will change the musical context, not transpose your melody or recording. You will confirm that choice yourself.',
    ],
  },
  rhythm: {
    title: 'Pulse, meter, and your phrase',
    summary: 'The same notes can move in different ways.',
    paragraphs: [
      'Tempo describes the speed of a pulse. Meter groups pulses and subdivisions into bars. Aligning a recording also means choosing where beat one falls; a tempo alone cannot tell us that.',
      'In 3/4, a bar normally groups three quarter-note beats. In 6/8, it normally groups two dotted-quarter pulses, each divided into three eighth notes. The equal number of eighth notes does not make their grouping the same.',
      'Songbird uses one selected phrase of up to eight bars. The original recording stays intact. Future note editing will snap to sixteenth notes, while the source timing remains available separately.',
    ],
  },
  chords: {
    title: 'Chords and voicings',
    summary: 'Which notes you choose, and how you arrange them.',
    paragraphs: [
      'A C major triad contains C, E, and G. An A minor triad contains A, C, and E. Both include E, so either may be worth trying beneath an E in a melody. One shared note does not determine the whole progression.',
      'C-E-G and E-G-C are different arrangements of the same chord tones. This is a change in voicing, not a change from piano to guitar sound.',
      'The Chord Finder will let you choose chord order and duration. Its first editor is a progression builder, not a claim that the app has inferred the right chords from your recording.',
    ],
  },
  harmony: {
    title: 'A melody, with other voices',
    summary: 'Additional parts without replacing your lead.',
    paragraphs: [
      'A harmony part forms intervals with your lead and moves through the phrase. Songbird is intended to suggest one to four added lines around the original melody, not replace the melody or produce a finished vocal recording.',
      'When you supply chords, a harmony note can belong to the current chord or be a non-chord tone. A passing tone is one particular kind of non-chord tone; not every note outside a chord is a passing tone or a mistake.',
      'Without chords, explanations should use intervals and scale relationships. There is no hidden backing progression. Your protected edits remain your musical choices.',
    ],
  },
  scales: {
    title: 'Scales and modes',
    summary: 'A set of notes to explore, not a taste score.',
    paragraphs: [
      'Songbird will use one scale selector. Major and Ionian are the same option; natural minor and Aeolian are the same option. Dorian, Phrygian, Lydian, Mixolydian, and Locrian complete the standard diatonic modes.',
      'Harmonic minor raises the seventh relative to natural minor. The fixed or jazz form of melodic minor raises the sixth and seventh in both directions.',
      'A different harmony scale will be a reversible arrangement preview. It will not silently retune your lead or rename your chosen chords.',
    ],
  },
};

export function LearnPage({ topic, song }: { topic?: string; song: SongProject }) {
  const { state } = useLocation();
  const origin =
    readLearningOrigin(state) ?? song.workspace.helpReturn ?? lastToolLocation(song);
  const navigationState: LearningNavigationState = { learningOrigin: origin };
  const lesson = topic && Object.hasOwn(topics, topic) ? topics[topic as Lesson] : null;
  return (
    <div className={styles.learning}>
      <Link
        className={styles.backLink}
        to={origin === 'dashboard' ? '/' : toolPath(origin)}
      >
        <span aria-hidden="true">&larr;</span> Back to{' '}
        {origin === 'dashboard' ? 'dashboard' : toolNames[origin.tool]}
      </Link>
      {lesson ? (
        <article>
          <div className={styles.pageHeading}>
            <h1>{lesson.title}</h1>
            <p>{lesson.summary}</p>
          </div>
          <div className={styles.lessonText}>
            {lesson.paragraphs.map((text) => (
              <p key={text}>{text}</p>
            ))}
          </div>
          <aside className={styles.lessonNotice}>
            <h2>Listening comes with playback.</h2>
            <p>
              These are introductory notes. Audible examples and try-it activities are not
              available in the Shell foundation. Reading this page does not change your
              song.
            </p>
          </aside>
          <Link to="/learn" state={navigationState}>
            Browse all topics
          </Link>
        </article>
      ) : topic ? (
        <>
          <h1>This learning topic does not exist.</h1>
          <Link to="/learn" state={navigationState}>
            Browse learning topics
          </Link>
        </>
      ) : (
        <>
          <div className={styles.pageHeading}>
            <h1>A little understanding goes a long way.</h1>
            <p>
              Use what helps, skip what does not. Learning is never a gate to making
              music.
            </p>
          </div>
          <div className={styles.topicList}>
            {(Object.entries(topics) as [Lesson, (typeof topics)[Lesson]][]).map(
              ([id, item]) => (
                <Link to={`/learn/${id}`} key={id} state={navigationState}>
                  <div>
                    <h2>{item.title}</h2>
                    <p>{item.summary}</p>
                  </div>
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              ),
            )}
          </div>
        </>
      )}
    </div>
  );
}
