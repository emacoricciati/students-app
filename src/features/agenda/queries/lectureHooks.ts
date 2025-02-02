import { useMemo } from 'react';

import { Lecture as ApiLecture, LecturesApi } from '@polito/api-client';
import { useInfiniteQuery } from '@tanstack/react-query';

import { DateTime, Duration } from 'luxon';

import { CoursesPreferences } from '../../../core/contexts/PreferencesContext';
import { useGetCourses } from '../../../core/queries/courseHooks';
import { pluckData } from '../../../utils/queries';
import { Lecture } from '../types/Lecture';

export const LECTURES_QUERY_KEY = ['lectures'];

const useLectureClient = (): LecturesApi => {
  return new LecturesApi();
};

export const useGetLectureWeeks = (coursesPreferences: CoursesPreferences) => {
  const lectureClient = useLectureClient();
  const { data: courses } = useGetCourses();

  const oneWeek = Duration.fromDurationLike({ week: 1 });

  /**
   * Visible courses are the ones not hidden in preferences
   * and belonging to the study plan of the active career
   */
  const visibleCourseIds = useMemo(() => {
    if (!courses) return [];

    const hiddenUniqueShortcodes = Object.entries(coursesPreferences)
      .filter(([_, prefs]) => prefs.isHidden)
      .map(([uniqueShortcode]) => uniqueShortcode);

    return courses
      .filter(
        course =>
          course.id !== null &&
          !hiddenUniqueShortcodes.includes(course.uniqueShortcode),
      )
      .map(course => course.id as number);
  }, [courses, coursesPreferences]);

  const addUniqueShortcodeToLectures = (lectures: ApiLecture[]): Lecture[] => {
    return lectures.map(lecture => ({
      ...lecture,
      uniqueShortcode: courses!.find(course => course.id === lecture.courseId)
        ?.uniqueShortcode,
    }));
  };

  return useInfiniteQuery<Lecture[]>(
    LECTURES_QUERY_KEY,
    async ({ pageParam: since = DateTime.now().startOf('week') }) => {
      const until = since.plus(oneWeek);

      return lectureClient
        .getLectures({
          fromDate: since.toJSDate(),
          toDate: until.toJSDate(),
          courseIds: visibleCourseIds,
        })
        .then(pluckData)
        .then(addUniqueShortcodeToLectures);
    },
    {
      enabled: Array.isArray(visibleCourseIds),
      staleTime: Infinity, // TODO handle manual refetch of last page only
    },
  );
};
