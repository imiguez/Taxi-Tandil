import { EnglishMonthsAbbreviation, SpanishMonths } from "types/Dates";


export class DatesHelper {

    static monthsAbbreviationsMap: Map<EnglishMonthsAbbreviation, SpanishMonths> = new Map<EnglishMonthsAbbreviation, SpanishMonths>([
        ['Jan', 'Enero' ], ['Feb', 'Febrero'], ['Mar', 'Marzo'], ['Apr', 'Abril'], ['May', 'Mayo'],  ['Jun', 'Junio'], ['Jul', 'Julio'], ['Aug', 'Agosto'], ['Sep', 'Septiembre'], ['Oct', 'Octubre'], ['Nov', 'Noviembre'], ['Dec', 'Diciembre']
    ]);
    
}