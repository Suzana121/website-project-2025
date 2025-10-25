// שאילתה 1: ממוצע ציונים לכל קורס
const avgRatingPerCourse = [
  {
    $group: {
      _id: "$course",
      avgRating: { $avg: "$rating" }
    }
  }
];

// שאילתה 2: מספר סטודנטים בכל קורס
const studentsPerCourse = [
  {
    $project: {
      title: 1,
      studentsCount: { $size: "$students" }
    }
  }
];

// הסבר:
//(reviews) שאילתה 1 - עוברת על כל הביקורות מחשבת ממוצע ציונים לפי קורס 
// (courses) שאילתה 2 - עוברת על כל הקורסים וסופרת כמה סטודנטים יש בכל קורס 

module.exports = { avgRatingPerCourse, studentsPerCourse };